import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrsDocTemplate } from "@/lib/trs-documents";
import { parseStaffMembers, type StaffMember } from "@/lib/staff-utils";

export const runtime = "nodejs";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function credentialLabel(type: StaffMember["credentialType"]): string {
  const map: Record<StaffMember["credentialType"], string> = {
    none: "None",
    cda: "CDA",
    associates: "Associate's Degree",
    bachelors: "Bachelor's Degree",
    masters: "Master's Degree",
  };
  return map[type] ?? type;
}

function buildStaffBinderHtml(
  centerName: string,
  staff: StaffMember[],
  date: string
): string {
  const staffRows = staff
    .map(
      (m) => `
      <div class="staff-card">
        <h2 class="staff-name">${escapeHtml(m.name)}</h2>
        <table class="staff-table">
          <tbody>
            <tr><th>Role</th><td>${escapeHtml(m.role)}</td></tr>
            <tr><th>Credential</th><td>${escapeHtml(credentialLabel(m.credentialType))}</td></tr>
            <tr><th>Hire Date</th><td>${escapeHtml(m.hireDate || "—")}</td></tr>
            <tr><th>CPR Expiry</th><td>${escapeHtml(m.cprExpiry || "—")}</td></tr>
            <tr><th>Training Hours</th><td>${m.trainingHours} hrs</td></tr>
            <tr><th>Email</th><td>${escapeHtml(m.email || "—")}</td></tr>
          </tbody>
        </table>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Staff Credentials Binder — ${escapeHtml(centerName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; font-size: 12pt; color: #111; background: #fff; padding: 40px; }
    .doc-header { border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 32px; }
    .center-name { font-size: 10pt; font-weight: normal; color: #555; letter-spacing: 0.05em; text-transform: uppercase; }
    .doc-title { font-size: 22pt; font-weight: bold; margin: 6px 0 4px; color: #1a1a2e; }
    .doc-date { font-size: 10pt; color: #777; }
    .staff-card { margin-bottom: 32px; padding: 20px; border: 1px solid #ddd; border-radius: 4px; page-break-inside: avoid; }
    .staff-name { font-size: 15pt; font-weight: bold; color: #1a1a2e; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .staff-table { width: 100%; border-collapse: collapse; }
    .staff-table th { text-align: left; width: 160px; padding: 5px 10px 5px 0; font-size: 10pt; color: #555; font-weight: 600; vertical-align: top; }
    .staff-table td { padding: 5px 0; font-size: 11pt; vertical-align: top; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 9pt; color: #999; text-align: center; }
    @media print {
      body { padding: 20px; }
      .staff-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="center-name">${escapeHtml(centerName)}</div>
    <div class="doc-title">Staff Credentials Binder</div>
    <div class="doc-date">Generated ${escapeHtml(date)}</div>
  </div>
  ${staff.length === 0 ? '<p style="color:#777;">No staff members on file.</p>' : staffRows}
  <div class="footer">GrantReady — ${escapeHtml(centerName)} — Confidential</div>
</body>
</html>`;
}

function buildStandardDocHtml(
  centerName: string,
  docTitle: string,
  aiDraft: string,
  date: string
): string {
  const paragraphs = aiDraft
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(docTitle)} — ${escapeHtml(centerName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; font-size: 12pt; color: #111; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    .doc-header { border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 32px; }
    .center-name { font-size: 10pt; font-weight: normal; color: #555; letter-spacing: 0.05em; text-transform: uppercase; }
    .doc-title { font-size: 22pt; font-weight: bold; margin: 6px 0 4px; color: #1a1a2e; }
    .doc-date { font-size: 10pt; color: #777; }
    .doc-body p { margin-bottom: 14px; line-height: 1.7; }
    .empty-notice { color: #777; font-style: italic; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 9pt; color: #999; text-align: center; }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="center-name">${escapeHtml(centerName)}</div>
    <div class="doc-title">${escapeHtml(docTitle)}</div>
    <div class="doc-date">Generated ${escapeHtml(date)}</div>
  </div>
  <div class="doc-body">
    ${paragraphs || '<p class="empty-notice">No content has been drafted for this document yet.</p>'}
  </div>
  <div class="footer">GrantReady — ${escapeHtml(centerName)} — Confidential</div>
</body>
</html>`;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const docType = searchParams.get("docType");
    const applicationId = searchParams.get("applicationId");

    if (!docType || !applicationId) {
      return NextResponse.json(
        { error: "Missing required query params: docType, applicationId" },
        { status: 400 }
      );
    }

    const template = getTrsDocTemplate(docType);
    if (!template) {
      return NextResponse.json(
        { error: `Unknown docType: ${docType}` },
        { status: 400 }
      );
    }

    // Load center name
    const { data: centerRow } = await supabase
      .from("centers")
      .select("name")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const centerName = (centerRow?.name as string) || "Your Center";

    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Staff binder: special path — pull from center_data, not application_sections
    if (docType === "staff_binder") {
      const { data: centerDataRow } = await supabase
        .from("center_data")
        .select("staff_members")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      const staff = parseStaffMembers(
        (centerDataRow?.staff_members as string | null) ?? null
      );

      const html = buildStaffBinderHtml(centerName, staff, date);
      const filename = `staff-credentials-binder.html`;

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Standard docs: load from application_sections
    const { data: sectionRow } = await supabase
      .from("application_sections")
      .select("ai_draft")
      .eq("application_id", applicationId)
      .eq("section_type", docType)
      .limit(1)
      .single();

    const aiDraft = (sectionRow?.ai_draft as string) || "";

    const html = buildStandardDocHtml(
      centerName,
      template.title,
      aiDraft,
      date
    );

    const safeTitle = template.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const filename = `${safeTitle}.html`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
