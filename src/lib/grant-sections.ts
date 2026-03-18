// Template sections for each grant application type.
// Each section has a type, title, prompt, sub-prompts, and whether it's narrative/data/budget.

export interface SectionTemplate {
  type: string;
  title: string;
  kind: "narrative" | "data" | "budget";
  prompt: string;
  subPrompts: string[];
  timeEstimate: string; // e.g. "5 min"
}

// Default narrative grant sections (used by most Type 2 grants)
export const defaultNarrativeSections: SectionTemplate[] = [
  {
    type: "statement_of_need",
    title: "Statement of Need",
    kind: "narrative",
    prompt: "Tell us about the families and community your center serves, and why this funding matters.",
    subPrompts: [
      "Who are the families at your center? (ages, income levels, languages spoken, how many children)",
      "What's the hardest thing they're dealing with right now?",
      "What happens when families in your area can't find childcare?",
    ],
    timeEstimate: "5 min",
  },
  {
    type: "program_description",
    title: "Program Description",
    kind: "narrative",
    prompt: "Describe what you'll do with this grant funding — the program or improvement you're proposing.",
    subPrompts: [
      "What specifically will you do with this money? (new program, expanded hours, equipment, training, etc.)",
      "How many children or families will benefit, and how?",
      "What's your timeline — when will things start and when will you see results?",
    ],
    timeEstimate: "5 min",
  },
  {
    type: "goals_objectives",
    title: "Goals & Objectives",
    kind: "narrative",
    prompt: "What will success look like? How will you measure it?",
    subPrompts: [
      "What's the main goal you're trying to achieve?",
      "What specific, measurable outcomes will show it's working? (numbers, percentages, milestones)",
      "How will you track and report progress?",
    ],
    timeEstimate: "4 min",
  },
  {
    type: "organizational_capacity",
    title: "Organizational Capacity",
    kind: "narrative",
    prompt: "Tell us about your center's experience and ability to carry out this project.",
    subPrompts: [
      "How long has your center been operating? Any accreditations or quality ratings?",
      "Who will lead this project, and what's their experience?",
      "Have you managed grant funding before? If so, how did it go?",
    ],
    timeEstimate: "4 min",
  },
  {
    type: "sustainability",
    title: "Sustainability Plan",
    kind: "narrative",
    prompt: "How will you keep things going after the grant money runs out?",
    subPrompts: [
      "What parts of this project can you maintain with your existing budget?",
      "Are there other funding sources you'll pursue?",
      "What's your plan for the staff or equipment you're funding with this grant?",
    ],
    timeEstimate: "3 min",
  },
  {
    type: "center_data",
    title: "Center Information",
    kind: "data",
    prompt: "We'll auto-fill this from your center profile. Just review and confirm.",
    subPrompts: [],
    timeEstimate: "2 min",
  },
  {
    type: "budget",
    title: "Budget",
    kind: "budget",
    prompt: "We'll help you build a line-item budget with examples from similar grants.",
    subPrompts: [],
    timeEstimate: "8 min",
  },
];

// Map grant IDs to their section templates
// For MVP, all grants use the default template
export function getSectionsForGrant(grantId: number): SectionTemplate[] {
  return defaultNarrativeSections;
}

export function getTotalTimeEstimate(sections: SectionTemplate[]): string {
  const totalMin = sections.reduce((sum, s) => {
    const n = parseInt(s.timeEstimate);
    return sum + (isNaN(n) ? 5 : n);
  }, 0);
  return `~${totalMin} min`;
}
