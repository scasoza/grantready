export interface TrsDocTemplate {
  docType: string;
  title: string;
  prompt: string;
  subPrompts: string[];
  autoIncludedData: string[];
  requiresDirectorInput: boolean;
}

export const trsDocTemplates: TrsDocTemplate[] = [
  // === CORE TRS DOCUMENTS ===
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

  // === ADDITIONAL REQUIRED TRS DOCUMENTS ===
  {
    docType: "training_plan",
    title: "Staff Training & Professional Development Plan",
    prompt: "Describe your training plan for staff this year. What training will each person receive?",
    subPrompts: [
      "Required annual training hours (24+ for TRS)",
      "Specific training topics planned (child development, safety, curriculum)",
      "How you identify each staff member's training needs",
      "Training sources you use (TECPDS, workshops, conferences, online)",
    ],
    autoIncludedData: ["center_name", "staff_count"],
    requiresDirectorInput: true,
  },
  {
    docType: "health_safety_policy",
    title: "Health & Safety Policies",
    prompt: "Describe your center's health and safety procedures. How do you keep children safe?",
    subPrompts: [
      "Illness policy (when to send children home, return requirements)",
      "Medication administration procedures",
      "Handwashing and hygiene routines",
      "Injury reporting and first aid procedures",
      "Immunization requirements and tracking",
    ],
    autoIncludedData: ["center_name", "licensed_capacity"],
    requiresDirectorInput: true,
  },
  {
    docType: "discipline_guidance",
    title: "Discipline & Guidance Policy",
    prompt: "How does your center handle behavior issues? What's your approach to discipline?",
    subPrompts: [
      "Your center's philosophy on guidance (positive reinforcement, redirection)",
      "Specific strategies teachers use for challenging behaviors",
      "What is NOT allowed (no corporal punishment, no withholding food/rest)",
      "How you communicate with parents about behavior concerns",
    ],
    autoIncludedData: ["center_name"],
    requiresDirectorInput: true,
  },
  {
    docType: "nutrition_policy",
    title: "Nutrition & Meal Policy",
    prompt: "Describe your meal program. What do children eat and how do you handle food at your center?",
    subPrompts: [
      "Meal and snack schedule",
      "How you handle allergies and dietary restrictions",
      "Whether you follow CACFP (Child and Adult Care Food Program)",
      "How mealtimes are used as learning opportunities",
    ],
    autoIncludedData: ["center_name", "enrollment_count"],
    requiresDirectorInput: true,
  },
  {
    docType: "emergency_preparedness",
    title: "Emergency Preparedness Plan",
    prompt: "What are your emergency procedures? How do you prepare for and respond to emergencies?",
    subPrompts: [
      "Fire drill schedule and procedures",
      "Severe weather / tornado procedures",
      "Lockdown procedures",
      "Evacuation plan with designated meeting point",
      "Emergency contact and communication plan for parents",
    ],
    autoIncludedData: ["center_name", "licensed_capacity"],
    requiresDirectorInput: true,
  },
  {
    docType: "safe_sleep_policy",
    title: "Safe Sleep Policy",
    prompt: "Describe your safe sleep practices for infants and toddlers.",
    subPrompts: [
      "Crib/sleeping arrangements (back to sleep, firm mattress, no loose bedding)",
      "Sleep check frequency and documentation",
      "How you handle parent requests that conflict with safe sleep guidelines",
      "Staff training on SIDS prevention",
    ],
    autoIncludedData: ["center_name"],
    requiresDirectorInput: true,
  },
];

export function getTrsDocTemplate(docType: string): TrsDocTemplate | null {
  return trsDocTemplates.find((t) => t.docType === docType) ?? null;
}
