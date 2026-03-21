// TRS Certification Roadmap — prioritized task checklist
// Tasks ordered by: dependencies first, then quickest wins early

export interface TrsTask {
  id: string;
  title: string;
  context: string; // one line explaining why this matters for TRS
  effort: string; // "15 min" | "1 phone call" | "needs scheduling" etc.
  category: "staff" | "docs" | "room" | "admin" | "training";
  dependsOn?: string[]; // task IDs that must be complete first
  action?: {
    type: "generate-doc" | "link" | "staff-tracker" | "room-check" | "self-assessment";
    label: string;
    href?: string;
    docType?: string;
  };
  zone?: "paperwork" | "prep";
}

export const trsTasks: TrsTask[] = [
  // === ADMIN PREREQUISITES ===
  {
    id: "ccs-enrolled",
    title: "Confirm active CCS provider agreement",
    context: "TRS requires an active Child Care Services agreement with your local Workforce Board",
    effort: "1 phone call",
    category: "admin",
  },
  {
    id: "license-12mo",
    title: "Verify 12+ months of licensing history",
    context: "You need at least 12 months of clean licensing history with CCR",
    effort: "5 min check",
    category: "admin",
  },
  {
    id: "compliance-check",
    title: "Review recent compliance history",
    context: "TRS requires high compliance with CCR minimum standards over the past 6 months",
    effort: "10 min",
    category: "admin",
  },

  // === STAFF CREDENTIALS (quick wins) ===
  {
    id: "director-registry",
    title: "Create director account in Texas Workforce Registry",
    context: "TRS requires your director account to be active in the WFR",
    effort: "15 min online",
    category: "staff",
    action: {
      type: "link",
      label: "Go to Workforce Registry",
      href: "https://www.texasearlychildhood.org/",
    },
  },
  {
    id: "staff-registry",
    title: "Ensure all staff have Workforce Registry accounts",
    context: "Each staff member needs an individual WFR account",
    effort: "5 min per person",
    category: "staff",
    action: { type: "staff-tracker", label: "Track staff credentials" },
  },
  {
    id: "cpr-current",
    title: "Verify all staff CPR/First Aid certifications are current",
    context: "Expired certifications are one of the most common assessment failures",
    effort: "5 min to check, varies to renew",
    category: "staff",
    action: { type: "staff-tracker", label: "Check expiration dates" },
  },
  {
    id: "director-quals",
    title: "Document director qualifications",
    context: "Director credential level affects your star rating directly",
    effort: "10 min",
    category: "staff",
    action: {
      type: "generate-doc",
      label: "Generate director quals summary",
      docType: "director_qualifications",
    },
  },
  {
    id: "staff-quals",
    title: "Document all staff qualifications and training hours",
    context: "Staff credential levels and annual training hours are scored in the assessment",
    effort: "15 min total",
    category: "staff",
    action: { type: "staff-tracker", label: "Enter staff credentials" },
  },

  // === DOCUMENTS ===
  {
    id: "curriculum-framework",
    title: "Write curriculum framework document",
    context: "Maps your daily activities to developmental domains — assessors will review this",
    effort: "20-30 min with AI help",
    category: "docs",
    action: {
      type: "generate-doc",
      label: "Generate with AI",
      docType: "curriculum_framework",
    },
  },
  {
    id: "parent-engagement",
    title: "Write parent/family engagement policy",
    context: "Formalizes how you communicate with and involve families",
    effort: "15-20 min with AI help",
    category: "docs",
    action: {
      type: "generate-doc",
      label: "Generate with AI",
      docType: "parent_engagement",
    },
  },
  {
    id: "daily-schedule",
    title: "Post daily schedule in each classroom",
    context: "Assessors check that a written daily schedule is visible to parents and staff",
    effort: "15 min",
    category: "docs",
  },
  {
    id: "weekly-objectives",
    title: "Create weekly learning objective cards",
    context: "Posted in each classroom — shows parents and assessors your learning goals",
    effort: "10 min per week",
    category: "docs",
    action: {
      type: "generate-doc",
      label: "Generate this week's card",
      docType: "weekly_objectives",
    },
  },

  // === ROOM PREPARATION ===
  {
    id: "room-materials",
    title: "Check classroom materials and learning centers",
    context: "Assessors use ECERS-3 / ITERS-3 scales to score room quality",
    effort: "30 min per room",
    category: "room",
    action: { type: "room-check", label: "Run room self-check" },
  },
  {
    id: "outdoor-area",
    title: "Review outdoor play area setup",
    context: "Outdoor environment is scored separately in the assessment",
    effort: "20 min",
    category: "room",
  },
  {
    id: "books-displayed",
    title: "Display books face-out and within children's reach",
    context: "Book display is a specific item on the assessment scale",
    effort: "10 min",
    category: "room",
  },
  {
    id: "science-nature",
    title: "Set up a science or nature area accessible to children",
    context: "Self-directed exploration is scored in the assessment",
    effort: "30 min",
    category: "room",
  },

  // === TRAINING ===
  {
    id: "annual-training",
    title: "Verify all staff have required annual training hours",
    context: "TRS requires more training hours than licensing minimums",
    effort: "5 min to check per person",
    category: "training",
    action: { type: "staff-tracker", label: "Check training hours" },
  },
  {
    id: "trs-orientation",
    title: "Complete TRS orientation training",
    context: "Required before initial certification",
    effort: "2-3 hours online",
    category: "training",
    action: {
      type: "link",
      label: "Access TRS training",
      href: "https://www.texasearlychildhood.org/",
    },
  },

  // === FINAL STEPS (depend on above) ===
  {
    id: "cqip",
    title: "Develop Continuous Quality Improvement Plan (CQIP)",
    context: "Required document for TRS application — outlines your improvement goals",
    effort: "30 min with AI help",
    category: "docs",
    dependsOn: ["curriculum-framework", "parent-engagement", "room-materials"],
    action: {
      type: "generate-doc",
      label: "Generate CQIP",
      docType: "cqip",
    },
  },
  {
    id: "staff-binder",
    title: "Generate and print staff credentials binder",
    context: "Physical binder the assessor reviews — one page per staff member",
    effort: "5 min to generate, then print",
    category: "docs",
    dependsOn: ["staff-quals", "cpr-current"],
    action: {
      type: "generate-doc",
      label: "Generate binder PDF",
      docType: "staff_binder",
    },
  },
  {
    id: "self-assessment",
    title: "Complete TRS self-assessment form",
    context: "~80 items — we auto-fill what we can from your data",
    effort: "45 min (mostly auto-filled)",
    category: "admin",
    dependsOn: ["curriculum-framework", "parent-engagement", "staff-quals", "cqip"],
    action: { type: "self-assessment", label: "Start self-assessment" },
  },
  {
    id: "submit-application",
    title: "Submit certification request to your Workforce Board",
    context: "Once self-assessment is done, you're ready to request your assessment visit",
    effort: "15 min",
    category: "admin",
    dependsOn: ["self-assessment"],
  },
];

export const categoryLabels: Record<TrsTask["category"], string> = {
  admin: "Administrative",
  staff: "Staff & Credentials",
  docs: "Documents",
  room: "Classroom Setup",
  training: "Training",
};

export const categoryColors: Record<TrsTask["category"], string> = {
  admin: "bg-slate-100 text-slate-700 border-slate-200",
  staff: "bg-violet-50 text-violet-700 border-violet-200",
  docs: "bg-blue-50 text-blue-700 border-blue-200",
  room: "bg-amber-50 text-amber-700 border-amber-200",
  training: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// Calculate estimated annual revenue increase from TRS certification
export function estimateRevenueIncrease(ccsChildCount: number, currentStars: number): {
  monthlyIncrease: number;
  annualIncrease: number;
  targetStars: number;
} {
  // Average CCS rate differential per child per day (approximate across TX counties)
  // Base rate → 2-star: ~$2-3/child/day increase
  // Base rate → 3-star: ~$4-5/child/day increase
  // Base rate → 4-star: ~$5-7/child/day increase
  const dailyRateIncrease: Record<number, number> = {
    0: 3.5, // no stars → 2-star
    2: 2.0, // 2-star → 3-star
    3: 2.5, // 3-star → 4-star
  };

  const targetStars = currentStars < 2 ? 2 : currentStars < 4 ? currentStars + 1 : 4;
  const dailyIncrease = dailyRateIncrease[currentStars] || 3.5;
  const monthlyIncrease = Math.round(ccsChildCount * dailyIncrease * 22); // ~22 business days
  const annualIncrease = monthlyIncrease * 12;

  return { monthlyIncrease, annualIncrease, targetStars };
}
