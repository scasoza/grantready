export interface TrsDocTemplate {
  docType: string;
  title: string;
  prompt: string;
  subPrompts: string[];
  autoIncludedData: string[];
  requiresDirectorInput: boolean;
}

export const trsDocTemplates: TrsDocTemplate[] = [
  {
    docType: "curriculum_framework",
    title: "Curriculum Framework",
    prompt: "Describe a typical day at your center. What do kids do from drop-off to pick-up?",
    subPrompts: [
      "Age groups you serve",
      "Daily schedule blocks (meals, nap, learning, outdoor)",
      "How you handle transitions between activities",
      "Learning domains covered (language, math, social-emotional, physical)",
    ],
    autoIncludedData: ["center_name", "licensed_capacity", "enrollment_count"],
    requiresDirectorInput: true,
  },
  {
    docType: "parent_engagement",
    title: "Parent & Family Engagement Policy",
    prompt: "How do you communicate with parents? What do you do to involve families?",
    subPrompts: [
      "Communication methods (app, newsletter, conferences, daily reports)",
      "Family events you host",
      "How you handle parent concerns or complaints",
      "Volunteer or participation opportunities",
    ],
    autoIncludedData: ["center_name", "enrollment_count"],
    requiresDirectorInput: true,
  },
  {
    docType: "cqip",
    title: "Continuous Quality Improvement Plan (CQIP)",
    prompt: "What are the biggest things you want to improve at your center this year?",
    subPrompts: [
      "Staff development goals",
      "Classroom environment improvements",
      "Family engagement goals",
      "Timeline for changes",
    ],
    autoIncludedData: ["center_name", "staff_count"],
    requiresDirectorInput: true,
  },
  {
    docType: "weekly_objectives",
    title: "Weekly Learning Objectives",
    prompt: "What are your learning goals for this week? What activities are planned?",
    subPrompts: [
      "Age-appropriate learning goals",
      "Connection to developmental domains",
      "Indoor and outdoor activities",
    ],
    autoIncludedData: ["center_name"],
    requiresDirectorInput: true,
  },
  {
    docType: "staff_binder",
    title: "Staff Credentials Binder",
    prompt: "",
    subPrompts: [],
    autoIncludedData: ["staff_members"],
    requiresDirectorInput: false,
  },
  {
    docType: "director_qualifications",
    title: "Director Qualifications Summary",
    prompt: "Describe your education, certifications, and childcare experience.",
    subPrompts: [
      "Degrees held",
      "CDA or other credentials",
      "Years of experience in childcare",
      "Specialized training completed",
    ],
    autoIncludedData: ["center_name"],
    requiresDirectorInput: true,
  },
];

export function getTrsDocTemplate(docType: string): TrsDocTemplate | null {
  return trsDocTemplates.find((t) => t.docType === docType) ?? null;
}
