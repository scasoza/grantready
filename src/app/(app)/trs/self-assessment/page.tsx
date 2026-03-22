"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { parseStaffMembers, daysUntil } from "@/lib/staff-utils";
import LoadingScreen from "@/components/LoadingScreen";
import Logo from "@/components/Logo";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Answer = "yes" | "no" | "na" | null;

interface ChecklistItem {
  id: string;
  label: string;
  hint?: string; // explains what "yes" means for this item
  autoFillKey?: string; // key used to resolve auto-fill from center data
}

interface ChecklistCategory {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

// ---------------------------------------------------------------------------
// Checklist definition
// ---------------------------------------------------------------------------

const categories: ChecklistCategory[] = [
  {
    id: "director_staff",
    title: "Director & Staff Qualifications",
    description: "Auto-filled from your staff tracker when possible",
    items: [
      { id: "director_registry", label: "Director has active Workforce Registry account", hint: "You have a current account at public.tecpds.org with your education and employment history entered", autoFillKey: "director_registry" },
      { id: "director_education", label: "Director meets education requirements for current star level", hint: "2-Star: CDA or 60 college hours. 3-Star: Associate's. 4-Star: Bachelor's in ECE or related field", autoFillKey: "director_education" },
      { id: "all_staff_registry", label: "All staff have Workforce Registry accounts", hint: "Every staff member who works directly with children has their own TECPDS account linked to your center", autoFillKey: "all_staff_registry" },
      { id: "cpr_current", label: "All staff CPR/First Aid certifications are current", hint: "Every staff member has a valid, non-expired CPR and First Aid certification card on file", autoFillKey: "cpr_current" },
      { id: "training_hours", label: "All staff meet annual training hour requirements (24+ hrs)", hint: "Each staff member has completed at least 24 hours of documented training this year (TRS requirement is higher than the 15-20 CCR minimum)", autoFillKey: "training_hours" },
      { id: "staff_ratios", label: "Staff-child ratios meet TRS requirements", hint: "Your staffing meets or exceeds the minimum ratios: 1:4 for infants, 1:11 for toddlers, 1:15 for preschool, 1:22 for school-age", autoFillKey: "staff_ratios" },
    ],
  },
  {
    id: "written_plans",
    title: "Written Plans & Documentation",
    description: "Auto-filled from your generated documents",
    items: [
      { id: "curriculum_complete", label: "Curriculum framework document is complete", hint: "A written document describing your daily schedule, learning activities, and how they map to developmental domains", autoFillKey: "curriculum_complete" },
      { id: "parent_engagement_complete", label: "Parent/family engagement policy is complete", hint: "A written policy covering communication methods, family events, complaint procedures, and volunteer opportunities", autoFillKey: "parent_engagement_complete" },
      { id: "cqip_complete", label: "Continuous Quality Improvement Plan (CQIP) is complete", hint: "Written goals for this year with specific timelines — staff development, classroom improvements, family engagement", autoFillKey: "cqip_complete" },
      { id: "weekly_objectives_posted", label: "Weekly learning objectives posted in classrooms", hint: "A printed card or poster in each classroom showing this week's learning goals and planned activities" },
      { id: "daily_schedule_posted", label: "Daily schedule posted in each classroom", hint: "A printed schedule showing time blocks for meals, learning, outdoor play, nap, etc. — visible to parents at the door" },
      { id: "staff_binder_complete", label: "Staff credentials binder is complete and current", hint: "A physical binder with one page per staff member showing credentials, CPR dates, training hours, and hire date", autoFillKey: "staff_binder_complete" },
    ],
  },
  {
    id: "indoor_environment",
    title: "Learning Environment -- Indoor",
    description: "Self-reported by the director",
    items: [
      { id: "age_appropriate_materials", label: "Age-appropriate materials in each learning center", hint: "Materials on low shelves that children can reach independently, organized by learning area, and rotated regularly" },
      { id: "books_displayed", label: "Books displayed face-out and accessible to children", hint: "At least 1 book per child, covers facing out, mix of fiction/non-fiction/diverse cultures, in a cozy reading area" },
      { id: "science_area", label: "Science/nature area available for self-directed exploration", hint: "Table or shelf with magnifying glasses, natural items (rocks, shells, leaves), magnets, or a small garden/plant" },
      { id: "art_supplies", label: "Art supplies accessible for creative expression", hint: "Crayons, markers, paint, paper, scissors, glue accessible on shelves — not locked in a closet" },
      { id: "dramatic_play", label: "Dramatic play area set up with diverse props", hint: "Dress-up clothes, play kitchen, dolls, puppets — reflecting diverse cultures, abilities, and family structures" },
      { id: "block_area", label: "Block/construction area with variety of materials", hint: "Unit blocks, large hollow blocks, LEGO/Duplo, vehicles, and accessories like road signs or animals" },
      { id: "writing_materials", label: "Writing materials accessible in multiple areas", hint: "Paper, pencils, crayons available not just in art area but also in dramatic play, science, etc." },
      { id: "math_materials", label: "Manipulatives and math materials available", hint: "Counting bears, pattern blocks, sorting trays, number puzzles, measuring cups — for hands-on math" },
      { id: "music_materials", label: "Music and movement materials accessible", hint: "Instruments (shakers, drums, bells), scarves for dancing, CD/speaker for music — children can access freely" },
      { id: "cozy_area", label: "Cozy/quiet area available for children", hint: "A soft space with pillows, stuffed animals, and books where a child can go to decompress" },
    ],
  },
  {
    id: "outdoor_environment",
    title: "Learning Environment -- Outdoor",
    description: "Self-reported by the director",
    items: [
      { id: "outdoor_safety", label: "Outdoor play area meets safety requirements", hint: "Safe surfacing under equipment, secure fencing, no hazards, equipment in good repair" },
      { id: "outdoor_equipment", label: "Variety of outdoor equipment (climbing, riding, sand/water)", hint: "Multiple types of play: climbing structures, tricycles/bikes, sandbox or water table, balls" },
      { id: "shade_available", label: "Shade available in outdoor area", hint: "Trees, shade sails, canopies, or covered areas where children can play out of direct sun" },
      { id: "nature_elements", label: "Nature elements present (garden, plants, natural materials)", hint: "Small garden, potted plants, bird feeder, natural loose parts (sticks, pine cones) for exploration" },
    ],
  },
  {
    id: "program_admin",
    title: "Program Administration",
    description: "Self-reported by the director",
    items: [
      { id: "ccs_agreement", label: "Active CCS provider agreement on file", hint: "You have a current agreement with your local Workforce Solutions to accept subsidized (CCS) children" },
      { id: "clean_licensing", label: "12+ months of clean licensing history", hint: "Your CCR license has been active for at least 12 months with no unresolved deficiencies" },
      { id: "ccr_compliance", label: "Compliance with CCR minimum standards", hint: "Your last 2-3 CCR inspections show no major or repeated violations" },
      { id: "parent_communication", label: "Parent communication system in place (app, newsletter, etc.)", hint: "You have a regular way to communicate with families — Brightwheel, HiMama, newsletter, daily reports, etc." },
      { id: "conference_schedule", label: "Family conference schedule maintained", hint: "You offer formal parent-teacher conferences at least twice per year and maintain a schedule" },
      { id: "enrollment_records", label: "Enrollment and attendance records current", hint: "You maintain daily attendance sign-in/out sheets and current enrollment records for all children" },
      { id: "emergency_procedures", label: "Emergency procedures posted and practiced", hint: "Fire drill schedule posted, drills conducted monthly, evacuation plan posted at exits, lockdown procedure documented" },
    ],
  },
];

const ALL_ITEM_IDS = categories.flatMap((c) => c.items.map((i) => i.id));
const TOTAL_ITEMS = ALL_ITEM_IDS.length;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SelfAssessmentPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [pageLoading, setPageLoading] = useState(true);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Auto-fill logic: resolve data sources into yes/no
  // -------------------------------------------------------------------------
  const computeAutoFill = useCallback(
    (
      verifiedDocs: Set<string>,
      staffCprOk: boolean,
      staffTrainingOk: boolean,
      hasStaff: boolean,
      directorCredential: string
    ): Record<string, Answer> => {
      const filled: Record<string, Answer> = {};

      // Staff qualifications
      if (hasStaff) {
        // Director education: check director credential
        if (directorCredential && directorCredential !== "none") {
          filled["director_education"] = "yes";
        }
        filled["cpr_current"] = staffCprOk ? "yes" : "no";
        filled["training_hours"] = staffTrainingOk ? "yes" : "no";
      }

      // Document completeness
      if (verifiedDocs.has("curriculum_framework")) filled["curriculum_complete"] = "yes";
      if (verifiedDocs.has("parent_engagement")) filled["parent_engagement_complete"] = "yes";
      if (verifiedDocs.has("cqip")) filled["cqip_complete"] = "yes";
      if (verifiedDocs.has("staff_binder")) filled["staff_binder_complete"] = "yes";

      return filled;
    },
    []
  );

  // -------------------------------------------------------------------------
  // Load data
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: center } = await supabase
        .from("centers")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!center) return;

      // Ensure TRS application exists
      let appId: string;
      const { data: existingApp } = await supabase
        .from("applications")
        .select("id")
        .eq("center_id", center.id)
        .eq("grant_id", "trs")
        .single();

      if (existingApp) {
        appId = existingApp.id;
      } else {
        const { data: newApp } = await supabase
          .from("applications")
          .insert({ center_id: center.id, grant_id: "trs" })
          .select("id")
          .single();
        if (!newApp) return;
        appId = newApp.id;
      }

      // Load existing self_assessment section
      const { data: existingSection } = await supabase
        .from("application_sections")
        .select("*")
        .eq("application_id", appId)
        .eq("section_type", "self_assessment")
        .single();

      let savedAnswers: Record<string, Answer> = {};

      if (existingSection) {
        setSectionId(existingSection.id);
        if (existingSection.ai_draft) {
          try {
            savedAnswers = JSON.parse(existingSection.ai_draft);
          } catch {
            // ignore bad JSON
          }
        }
      } else {
        const { data: newSection } = await supabase
          .from("application_sections")
          .insert({
            application_id: appId,
            section_type: "self_assessment",
            status: "pending",
          })
          .select("id")
          .single();
        if (newSection) {
          setSectionId(newSection.id);
        }
      }

      // Load verified TRS docs for auto-fill
      const { data: allSections } = await supabase
        .from("application_sections")
        .select("section_type, status")
        .eq("application_id", appId);

      const verifiedDocs = new Set<string>();
      if (allSections) {
        for (const s of allSections) {
          if (s.status === "verified") {
            verifiedDocs.add(s.section_type);
          }
        }
      }

      // Load staff data
      const { data: staffData } = await supabase
        .from("center_data")
        .select("data_value")
        .eq("center_id", center.id)
        .eq("data_key", "staff_members")
        .maybeSingle();

      const staffMembers = parseStaffMembers(
        (staffData as { data_value: string } | null)?.data_value ?? null
      );

      const hasStaff = staffMembers.length > 0;
      const staffCprOk =
        hasStaff &&
        staffMembers.every((m) => {
          const d = daysUntil(m.cprExpiry);
          return d !== null && d > 0;
        });
      const staffTrainingOk =
        hasStaff && staffMembers.every((m) => m.trainingHours >= 24);

      // Find director credential
      const director = staffMembers.find(
        (m) => m.role.toLowerCase().includes("director")
      );
      const directorCredential = director?.credentialType ?? "none";

      const autoFillValues = computeAutoFill(
        verifiedDocs,
        staffCprOk,
        staffTrainingOk,
        hasStaff,
        directorCredential
      );

      // Merge: saved answers take precedence, auto-fill for anything not yet answered
      const merged: Record<string, Answer> = {};
      const autoKeys = new Set<string>();

      for (const [key, val] of Object.entries(autoFillValues)) {
        if (!(key in savedAnswers) || savedAnswers[key] === null) {
          merged[key] = val;
          autoKeys.add(key);
        }
      }

      for (const [key, val] of Object.entries(savedAnswers)) {
        merged[key] = val;
      }

      setAnswers(merged);
      setAutoFilled(autoKeys);

      // Auto-expand first category with unanswered items
      const firstIncomplete = categories.find((cat) =>
        cat.items.some((item) => !merged[item.id])
      );
      if (firstIncomplete) {
        setExpandedCategory(firstIncomplete.id);
      }

      setPageLoading(false);
    }

    load();
  }, [supabase, computeAutoFill]);

  // -------------------------------------------------------------------------
  // Save to Supabase (debounced on change)
  // -------------------------------------------------------------------------
  const persistAnswers = useCallback(
    async (updated: Record<string, Answer>) => {
      if (!sectionId) return;
      setSaving(true);
      const answeredCount = Object.values(updated).filter((v) => v !== null).length;
      const status =
        answeredCount === TOTAL_ITEMS ? "verified" : answeredCount > 0 ? "draft_generated" : "pending";

      await supabase
        .from("application_sections")
        .update({
          ai_draft: JSON.stringify(updated),
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sectionId);
      setSaving(false);
    },
    [supabase, sectionId]
  );

  // -------------------------------------------------------------------------
  // Answer a single item
  // -------------------------------------------------------------------------
  const setAnswer = useCallback(
    (itemId: string, value: Answer) => {
      setAnswers((prev) => {
        // Toggle off if same value tapped
        const newVal = prev[itemId] === value ? null : value;
        const updated = { ...prev, [itemId]: newVal };
        persistAnswers(updated);
        return updated;
      });
      // Remove from auto-filled set if user changes it
      setAutoFilled((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    },
    [persistAnswers]
  );

  // -------------------------------------------------------------------------
  // Progress computation
  // -------------------------------------------------------------------------
  const answeredCount = Object.values(answers).filter((v) => v !== null).length;
  const yesCount = Object.values(answers).filter((v) => v === "yes").length;
  const noCount = Object.values(answers).filter((v) => v === "no").length;
  const naCount = Object.values(answers).filter((v) => v === "na").length;
  const progressPct = Math.round((answeredCount / TOTAL_ITEMS) * 100);
  const allDone = answeredCount === TOTAL_ITEMS;

  const categoryProgress = (cat: ChecklistCategory) => {
    const answered = cat.items.filter((i) => answers[i.id] !== null && answers[i.id] !== undefined).length;
    return { answered, total: cat.items.length };
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (pageLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-warm-50 pb-32">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-brand-700 shadow-md">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3 max-w-3xl mx-auto">
          <Link
            href="/dashboard"
            className="text-brand-200 hover:text-white transition p-2 -m-2"
            aria-label="Back to dashboard"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">TRS Self-Assessment</h1>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-brand-200 animate-pulse">Saving...</span>
            )}
            <Logo size={24} />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Progress card */}
        <div className="bg-white border border-warm-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-warm-900">Your Progress</h2>
            <span className="text-sm font-semibold text-brand-600">
              {answeredCount} of {TOTAL_ITEMS}
            </span>
          </div>
          <div className="w-full h-3 bg-warm-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-3 flex gap-4 text-xs text-warm-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-500" />
              Yes: {yesCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400" />
              No: {noCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-warm-300" />
              N/A: {naCount}
            </span>
          </div>
        </div>

        {/* Auto-fill notice */}
        {autoFilled.size > 0 && (
          <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-700">
            <span className="font-semibold">{autoFilled.size} items</span> were auto-filled
            from your staff tracker and completed documents. You can change them anytime.
          </div>
        )}

        {/* Categories */}
        {categories.map((cat) => {
          const { answered, total } = categoryProgress(cat);
          const isExpanded = expandedCategory === cat.id;
          const catDone = answered === total;

          return (
            <div
              key={cat.id}
              className="bg-white border border-warm-100 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Category header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-3 active:bg-warm-50 transition"
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    catDone
                      ? "bg-brand-500 text-white"
                      : answered > 0
                      ? "bg-brand-100 text-brand-600"
                      : "bg-warm-100 text-warm-400"
                  }`}
                >
                  {catDone ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    `${answered}`
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-warm-900 truncate">{cat.title}</p>
                  <p className="text-xs text-warm-400 mt-0.5">
                    {answered}/{total} answered
                    {cat.description.includes("Auto") && (
                      <span className="text-brand-500 ml-1">-- {cat.description}</span>
                    )}
                    {cat.description.includes("Self") && (
                      <span className="text-warm-400 ml-1">-- {cat.description}</span>
                    )}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-warm-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="border-t border-warm-100 divide-y divide-warm-50">
                  {cat.items.map((item) => {
                    const val = answers[item.id] ?? null;
                    const isAuto = autoFilled.has(item.id);

                    return (
                      <div key={item.id} className="px-5 py-3.5 flex items-start gap-3">
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm text-warm-800 leading-snug">{item.label}</p>
                          {item.hint && (
                            <p className="text-[11px] text-warm-400 mt-0.5 leading-relaxed">{item.hint}</p>
                          )}
                          {isAuto && (
                            <p className="text-[11px] text-brand-500 mt-0.5 font-medium">
                              Auto-filled from your data
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setAnswer(item.id, "yes")}
                            className={`min-w-[52px] py-2.5 rounded-lg text-sm font-semibold transition-all ${
                              val === "yes"
                                ? "bg-brand-500 text-white shadow-sm"
                                : "bg-warm-100 text-warm-500 hover:bg-brand-50 hover:text-brand-600 active:bg-brand-100"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setAnswer(item.id, "no")}
                            className={`min-w-[52px] py-2.5 rounded-lg text-sm font-semibold transition-all ${
                              val === "no"
                                ? "bg-red-500 text-white shadow-sm"
                                : "bg-warm-100 text-warm-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100"
                            }`}
                          >
                            No
                          </button>
                          <button
                            onClick={() => setAnswer(item.id, "na")}
                            className={`min-w-[44px] py-2.5 rounded-lg text-sm font-semibold transition-all ${
                              val === "na"
                                ? "bg-warm-400 text-white shadow-sm"
                                : "bg-warm-100 text-warm-500 hover:bg-warm-200 active:bg-warm-300"
                            }`}
                          >
                            N/A
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Summary card (shown when all done) */}
        {allDone && (
          <div className="bg-white border border-warm-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-4">
              <div className="flex items-center gap-2">
                <Logo size={28} />
                <div>
                  <p className="text-sm font-semibold text-white">Self-Assessment Complete</p>
                  <p className="text-xs text-white/70">
                    {yesCount} met, {noCount} need attention, {naCount} not applicable
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              {categories.map((cat) => {
                const catYes = cat.items.filter((i) => answers[i.id] === "yes").length;
                const catNo = cat.items.filter((i) => answers[i.id] === "no").length;
                const catNa = cat.items.filter((i) => answers[i.id] === "na").length;

                return (
                  <div key={cat.id} className="flex items-center justify-between">
                    <p className="text-sm text-warm-700 font-medium">{cat.title}</p>
                    <div className="flex gap-2 text-xs font-semibold">
                      {catYes > 0 && <span className="text-brand-600">{catYes} yes</span>}
                      {catNo > 0 && <span className="text-red-500">{catNo} no</span>}
                      {catNa > 0 && <span className="text-warm-400">{catNa} n/a</span>}
                    </div>
                  </div>
                );
              })}

              {noCount > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-amber-800 mb-2">
                    Items needing attention ({noCount})
                  </p>
                  <ul className="space-y-1">
                    {categories.flatMap((cat) =>
                      cat.items
                        .filter((i) => answers[i.id] === "no")
                        .map((item) => (
                          <li key={item.id} className="text-xs text-amber-700 flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">&#8226;</span>
                            {item.label}
                          </li>
                        ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-warm-200 safe-area-bottom z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-warm-900">
              {answeredCount}/{TOTAL_ITEMS} completed
            </div>
            <div className="text-xs text-warm-400">
              {allDone ? "All items answered" : `${TOTAL_ITEMS - answeredCount} remaining`}
            </div>
          </div>
          <button
            onClick={async () => {
              await persistAnswers(answers);
              router.replace("/dashboard");
            }}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition ${
              allDone
                ? "bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white"
                : "bg-warm-100 text-warm-600 hover:bg-warm-200"
            }`}
          >
            {allDone ? "Done -- back to dashboard" : "Save & exit"}
          </button>
        </div>
      </div>
    </div>
  );
}
