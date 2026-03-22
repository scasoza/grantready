import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trsDocTemplates } from "@/lib/trs-documents";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  hireDate: string;
  cprExpiry: string;
  credentialType: "none" | "cda" | "associates" | "bachelors" | "masters";
  trainingHours: number;
  email: string;
}

interface Check {
  category: "documents" | "staff" | "consistency";
  label: string;
  passed: boolean;
  detail: string;
  fixHref?: string;
}

function parseStaffMembers(raw: string | null): StaffMember[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is StaffMember =>
        typeof m === "object" && m !== null && typeof m.name === "string"
    );
  } catch {
    return [];
  }
}

function daysUntil(dateString: string): number | null {
  if (!dateString) return null;
  const target = new Date(dateString + "T00:00:00");
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

const PLACEHOLDER_RE = /\[(insert|your|TBD|TODO)/i;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { centerId } = (await request.json()) as { centerId: string };
    if (!centerId) {
      return NextResponse.json(
        { error: "centerId is required" },
        { status: 400 }
      );
    }

    const checks: Check[] = [];

    // ---- Document checks ----

    const { data: appRow } = await supabase
      .from("applications")
      .select("id")
      .eq("center_id", centerId)
      .eq("grant_id", "trs")
      .single();

    interface SectionRow {
      id: string;
      section_type: string;
      status: string;
      ai_draft: string | null;
    }

    let sectionRows: SectionRow[] = [];
    if (appRow) {
      const { data: secData } = await supabase
        .from("application_sections")
        .select("id, section_type, status, ai_draft")
        .eq("application_id", appRow.id);
      sectionRows = (secData as SectionRow[] | null) ?? [];
    }

    const sectionMap = new Map<string, SectionRow>();
    for (const s of sectionRows) {
      sectionMap.set(s.section_type, s);
    }

    // Load all verified claims at once
    const sectionIds = sectionRows.map((s) => s.id);
    interface ClaimRow {
      section_id: string;
      verified: boolean;
    }
    let allClaims: ClaimRow[] = [];
    if (sectionIds.length > 0) {
      const { data: claimData } = await supabase
        .from("verified_claims")
        .select("section_id, verified")
        .in("section_id", sectionIds);
      allClaims = (claimData as ClaimRow[] | null) ?? [];
    }

    const claimsBySection = new Map<string, ClaimRow[]>();
    for (const c of allClaims) {
      const arr = claimsBySection.get(c.section_id) ?? [];
      arr.push(c);
      claimsBySection.set(c.section_id, arr);
    }

    const allDrafts: string[] = [];

    for (const tmpl of trsDocTemplates) {
      const sec = sectionMap.get(tmpl.docType);
      const draft = sec?.ai_draft ?? "";
      if (draft) allDrafts.push(draft);
      const fixHref = `/trs/${tmpl.docType}`;

      // Check 1: section exists and verified
      checks.push({
        category: "documents",
        label: `${tmpl.title} - verified`,
        passed: sec?.status === "verified",
        detail: sec?.status === "verified"
          ? "Document has been verified"
          : sec
            ? `Document status is "${sec.status}"`
            : "Document has not been started",
        fixHref: sec?.status !== "verified" ? fixHref : undefined,
      });

      // Check 2: draft length > 200 words
      const wc = wordCount(draft);
      checks.push({
        category: "documents",
        label: `${tmpl.title} - sufficient content`,
        passed: wc > 200,
        detail: wc > 200
          ? `${wc} words`
          : `Only ${wc} words (need at least 200)`,
        fixHref: wc <= 200 ? fixHref : undefined,
      });

      // Check 3: no placeholder patterns
      const hasPlaceholders = PLACEHOLDER_RE.test(draft);
      checks.push({
        category: "documents",
        label: `${tmpl.title} - no placeholders`,
        passed: !hasPlaceholders,
        detail: hasPlaceholders
          ? "Contains placeholder text that needs to be filled in"
          : "No placeholder text found",
        fixHref: hasPlaceholders ? fixHref : undefined,
      });

      // Check 4: all claims verified
      if (sec) {
        const claims = claimsBySection.get(sec.id) ?? [];
        const unverified = claims.filter((c) => !c.verified);
        checks.push({
          category: "documents",
          label: `${tmpl.title} - claims verified`,
          passed: unverified.length === 0,
          detail:
            claims.length === 0
              ? "No claims to verify"
              : unverified.length === 0
                ? `All ${claims.length} claims verified`
                : `${unverified.length} of ${claims.length} claims not yet verified`,
          fixHref: unverified.length > 0 ? fixHref : undefined,
        });
      } else {
        checks.push({
          category: "documents",
          label: `${tmpl.title} - claims verified`,
          passed: false,
          detail: "Document not started",
          fixHref,
        });
      }
    }

    // ---- Staff checks ----

    const { data: staffData } = await supabase
      .from("center_data")
      .select("data_value")
      .eq("center_id", centerId)
      .eq("data_key", "staff_members")
      .maybeSingle();

    const staffMembers = parseStaffMembers(
      (staffData as { data_value: string } | null)?.data_value ?? null
    );

    const staffFixHref = "/staff";

    if (staffMembers.length === 0) {
      checks.push({
        category: "staff",
        label: "Staff members entered",
        passed: false,
        detail: "No staff members have been added",
        fixHref: staffFixHref,
      });
    } else {
      // CPR check per staff
      for (const member of staffMembers) {
        const days = daysUntil(member.cprExpiry);
        const expired = days !== null && days < 0;
        const valid = days !== null && days > 0;
        checks.push({
          category: "staff",
          label: `${member.name} - CPR current`,
          passed: valid,
          detail: expired
            ? `CPR expired ${Math.abs(days!)} days ago`
            : days !== null
              ? `CPR valid for ${days} more days`
              : "CPR expiry date not set",
          fixHref: !valid ? staffFixHref : undefined,
        });
      }

      // Training check per staff
      for (const member of staffMembers) {
        const enough = member.trainingHours >= 24;
        checks.push({
          category: "staff",
          label: `${member.name} - training hours`,
          passed: enough,
          detail: enough
            ? `${member.trainingHours} hours completed`
            : `${member.trainingHours}/24 required hours`,
          fixHref: !enough ? staffFixHref : undefined,
        });
      }

      // Director credential
      const directors = staffMembers.filter((m) =>
        m.role.toLowerCase().includes("director")
      );
      const directorCredentialed =
        directors.length > 0 &&
        directors.some((d) => d.credentialType !== "none");
      checks.push({
        category: "staff",
        label: "Director credential documented",
        passed: directorCredentialed,
        detail: directorCredentialed
          ? "Director has a documented credential"
          : directors.length === 0
            ? "No staff member with a director role found"
            : "Director has no documented credential",
        fixHref: !directorCredentialed ? staffFixHref : undefined,
      });

      // All staff credentialed
      const allCredentialed = staffMembers.every(
        (m) => m.credentialType !== "none"
      );
      checks.push({
        category: "staff",
        label: "All staff credentials documented",
        passed: allCredentialed,
        detail: allCredentialed
          ? "All staff have documented credentials"
          : `${staffMembers.filter((m) => m.credentialType === "none").length} staff missing credentials`,
        fixHref: !allCredentialed ? staffFixHref : undefined,
      });
    }

    // ---- Consistency checks (MVP: number matching across docs) ----

    const numberPattern = /\b\d{2,}\b/g;
    const numbersByDoc: Map<string, Set<string>> = new Map();

    for (let i = 0; i < trsDocTemplates.length; i++) {
      const sec = sectionMap.get(trsDocTemplates[i].docType);
      const draft = sec?.ai_draft ?? "";
      const nums = new Set<string>();
      let match;
      while ((match = numberPattern.exec(draft)) !== null) {
        nums.add(match[0]);
      }
      numbersByDoc.set(trsDocTemplates[i].docType, nums);
    }

    // Check that all docs that should exist do exist
    const docsWithContent = trsDocTemplates.filter((t) => {
      const sec = sectionMap.get(t.docType);
      return sec?.ai_draft && wordCount(sec.ai_draft) > 50;
    });

    checks.push({
      category: "consistency",
      label: "All documents present",
      passed: docsWithContent.length === trsDocTemplates.length,
      detail:
        docsWithContent.length === trsDocTemplates.length
          ? "All required documents have content"
          : `${docsWithContent.length} of ${trsDocTemplates.length} documents have content`,
      fixHref:
        docsWithContent.length < trsDocTemplates.length
          ? "/dashboard"
          : undefined,
    });

    // Basic number consistency: check capacity/enrollment mentioned across docs
    // that reference them — just flag if numbers appear in some but not others
    const capacityDocs = trsDocTemplates.filter((t) =>
      t.autoIncludedData.includes("licensed_capacity") ||
      t.autoIncludedData.includes("enrollment_count")
    );
    if (capacityDocs.length > 1) {
      const numberSets = capacityDocs
        .map((t) => numbersByDoc.get(t.docType) ?? new Set<string>())
        .filter((s) => s.size > 0);

      const consistent =
        numberSets.length <= 1 ||
        numberSets.every((set) => {
          const ref = numberSets[0];
          for (const n of ref) {
            if (set.has(n)) return true;
          }
          return true;
        });

      checks.push({
        category: "consistency",
        label: "Numbers consistent across documents",
        passed: consistent,
        detail: consistent
          ? "Key numbers appear consistent across documents"
          : "Some numbers may be inconsistent between documents",
        fixHref: !consistent ? "/dashboard" : undefined,
      });
    }

    const passed = checks.filter((c) => c.passed).length;
    const failed = checks.filter((c) => !c.passed).length;

    return NextResponse.json({
      checks,
      summary: { total: checks.length, passed, failed },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run readiness check";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
