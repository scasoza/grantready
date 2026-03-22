// TRS Certification Roadmap — prioritized task checklist
// Based on Texas Rising Star Certification Guidelines (October 2025)
// and TRS Document Checklist for Required Measures

export interface TrsTask {
  id: string;
  title: string;
  context: string; // one line explaining why this matters for TRS
  howTo?: string; // step-by-step guidance for completing this task
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
    howTo: "Call your local Workforce Solutions office and ask to verify your CCS provider agreement is active. If you already accept subsidized children, you likely have one. Your Workforce Board contact can confirm over the phone in a few minutes.",
    effort: "1 phone call",
    category: "admin",
  },
  {
    id: "license-12mo",
    title: "Verify 12+ months of licensing history",
    context: "You need at least 12 months of clean licensing history with CCR",
    howTo: "Check your Texas Health and Human Services (HHS) licensing portal or call your CCR licensing representative. You need at least 12 continuous months with your current license. If you recently opened, you must wait until you hit this milestone.",
    effort: "5 min check",
    category: "admin",
  },
  {
    id: "compliance-check",
    title: "Review recent compliance history",
    context: "TRS requires high compliance with CCR minimum standards over the past 6 months",
    howTo: "Review your last 2-3 CCR inspection reports. Look for any deficiencies or corrective actions. Minor issues that were corrected promptly are usually OK. Unresolved or repeated violations can delay certification. You can request copies from your licensing rep.",
    effort: "10 min",
    category: "admin",
  },

  // === STAFF CREDENTIALS ===
  {
    id: "director-registry",
    title: "Create director account in TECPDS (Texas Workforce Registry)",
    context: "TRS requires all directors to have an active account in the Texas Early Childhood Professional Development System",
    howTo: "Go to public.tecpds.org and click 'Create Account'. Choose 'Center Director/Administrator' as your account type. You'll need your center's license number, your education history, and employment details. The account is free.",
    effort: "15 min online",
    category: "staff",
    action: {
      type: "link",
      label: "Go to TECPDS Registry",
      href: "https://public.tecpds.org/",
    },
  },
  {
    id: "staff-registry",
    title: "Ensure all staff have TECPDS Registry accounts",
    context: "Each staff member needs an individual account in the Texas Workforce Registry",
    howTo: "Have each staff member go to public.tecpds.org and create a 'Practitioner' account. They'll need to link their account to your center. You can track who has completed this in the Staff Tracker.",
    effort: "5 min per person",
    category: "staff",
    action: { type: "staff-tracker", label: "Track staff credentials" },
  },
  {
    id: "cpr-current",
    title: "Verify all staff CPR/First Aid certifications are current",
    context: "Expired certifications are one of the most common assessment failures",
    howTo: "Check each staff member's CPR/First Aid card for the expiration date. Enter the dates in the Staff Tracker so we can alert you before they expire. If anyone's is expired, schedule a renewal class immediately — the American Red Cross and American Heart Association both offer classes in most Texas cities.",
    effort: "5 min to check, varies to renew",
    category: "staff",
    action: { type: "staff-tracker", label: "Check expiration dates" },
  },
  {
    id: "director-quals",
    title: "Document director qualifications",
    context: "Director credential level directly affects your star rating — higher credentials = higher star level",
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
    context: "Staff credential levels and annual training hours are scored in the assessment — TRS requires 24+ hours/year per staff",
    howTo: "For each staff member, enter their highest education level (CDA, Associate's, Bachelor's, Master's), total training hours for this year, and hire date. TRS requires at least 24 annual training hours per staff member — more than the basic licensing minimum.",
    effort: "15 min total",
    category: "staff",
    action: { type: "staff-tracker", label: "Enter staff credentials" },
  },

  // === DOCUMENTS ===
  {
    id: "curriculum-framework",
    title: "Write curriculum framework document",
    context: "Maps your daily activities to developmental domains — assessors will review this document during their visit",
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
    context: "Formalizes how you communicate with and involve families — a required TRS document",
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
    context: "Assessors check that a written daily schedule is visible to parents and staff in every room",
    howTo: "Create a simple schedule showing time blocks for arrival, meals, learning activities, outdoor play, nap, and departure. Print it large enough to read from the door. Post one in each classroom at adult eye level. Include the schedule for both the regular day and any variations.",
    effort: "15 min",
    category: "admin",
  },
  {
    id: "weekly-objectives",
    title: "Create weekly learning objective cards",
    context: "Posted in each classroom — shows parents and assessors your intentional learning goals for the week",
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
    context: "Assessors score room quality using standardized scales — materials must be age-appropriate, accessible, and organized",
    howTo: "Walk through each classroom and check that you have clearly defined learning centers: blocks/construction, dramatic play, art, science/nature, reading/library, and manipulatives/math. Materials should be on low shelves where children can reach them independently. Remove broken items and rotate materials regularly.",
    effort: "30 min per room",
    category: "room",
  },
  {
    id: "outdoor-area",
    title: "Review outdoor play area setup",
    context: "Outdoor environment is scored separately — must have variety, shade, and safety features",
    howTo: "Check that your outdoor area has: variety of equipment (climbing, riding toys, sand/water play), adequate shade, safe surfacing under equipment, clear boundaries, and age-appropriate materials. Remove any damaged equipment. If you lack shade, consider shade sails or canopies.",
    effort: "20 min",
    category: "room",
  },
  {
    id: "books-displayed",
    title: "Display books face-out and within children's reach",
    context: "Book display is a specific scored item on the assessment — books should be visible and inviting",
    howTo: "Place books on low shelves or in baskets with covers facing out so children can see them. Aim for at least 1 book per child in the classroom. Include a mix of fiction, non-fiction, and culturally diverse books. Rotate books to keep the selection fresh. Create a cozy reading nook if possible.",
    effort: "10 min",
    category: "room",
  },
  {
    id: "science-nature",
    title: "Set up a science or nature area accessible to children",
    context: "Self-directed exploration is scored — children should be able to explore natural materials independently",
    howTo: "Set up a small table or shelf with nature items: magnifying glasses, rocks, shells, leaves, pinecones, magnets, and simple tools. Add a small plant children can water. If possible, include a class pet (fish or hermit crab). The key is that children can access and explore these materials on their own.",
    effort: "30 min",
    category: "room",
  },

  // === TRAINING ===
  {
    id: "annual-training",
    title: "Verify all staff have required annual training hours",
    context: "TRS requires 24+ hours per year per staff member — more than basic licensing minimums of 15-20 hours",
    howTo: "Check each staff member's training hour total in the Staff Tracker. TRS requires 24 hours per year, which is higher than the CCR licensing minimum. Training must align with each person's individual written training plan. Online courses through TECPDS and local Workforce Board workshops count.",
    effort: "5 min to check per person",
    category: "training",
    action: { type: "staff-tracker", label: "Check training hours" },
  },
  {
    id: "trs-orientation",
    title: "Complete TRS orientation training",
    context: "Required before initial certification — available online through TECPDS",
    howTo: "Log into your TECPDS account at public.tecpds.org. Look for the Texas Rising Star orientation course in the training catalog. It's free and takes about 2-3 hours. You can complete it at your own pace. Print the certificate when done — you'll need it for your application.",
    effort: "2-3 hours online",
    category: "training",
    action: {
      type: "link",
      label: "Go to TECPDS training",
      href: "https://public.tecpds.org/",
    },
  },

  // === FINAL STEPS (depend on above) ===
  {
    id: "cqip",
    title: "Develop Continuous Quality Improvement Plan (CQIP)",
    context: "Required document for TRS — outlines specific, measurable goals for improving your program this year",
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
    context: "Physical binder the assessor reviews on-site — one page per staff member with all credentials",
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
    context: "Facility Assessment Record Form (FARF) — we auto-fill what we can from your data",
    effort: "45 min (mostly auto-filled)",
    category: "admin",
    dependsOn: ["curriculum-framework", "parent-engagement", "staff-quals", "cqip"],
    action: { type: "self-assessment", label: "Start self-assessment", docType: "self_assessment" },
  },
  {
    id: "submit-application",
    title: "Submit certification request to your Workforce Board",
    context: "We handle this for you — we submit the request and all documents to your local Workforce Solutions office",
    effort: "We handle this",
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
