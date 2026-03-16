export type GrantTier = "essential" | "growth" | "staff" | "foundation";
export type GrantStatus = "open" | "upcoming" | "ongoing";

export interface Grant {
  id: number;
  name: string;
  source: string;
  amount: string;
  deadline: string;
  eligibility: string;
  description: string;
  tier: GrantTier;
  status: GrantStatus;
  difficulty: "Easy" | "Medium" | "Hard";
  recurring: boolean;
}

export const tierLabels: Record<GrantTier, string> = {
  essential: "Essential Revenue",
  growth: "Growth & Improvement",
  staff: "Staff Development",
  foundation: "Private Foundations",
};

export const tierDescriptions: Record<GrantTier, string> = {
  essential:
    "Ongoing funding streams nearly every Texas center should have. These aren't one-time grants — they're recurring revenue.",
  growth:
    "One-time grants to expand capacity, improve facilities, or launch new programs.",
  staff:
    "Scholarships and training funds to develop your team and meet quality standards.",
  foundation:
    "Texas-based private foundations funding childcare improvement initiatives.",
};

export const grants: Grant[] = [
  // === ESSENTIAL REVENUE ===
  {
    id: 1,
    name: "CACFP Meal Reimbursement",
    source: "USDA / Texas Dept of Agriculture",
    amount: "$1.50–$4.00+ per meal per child",
    deadline: "Open enrollment — apply anytime",
    eligibility: "Licensed childcare centers serving meals/snacks",
    description:
      "The single biggest recurring funding source most centers underutilize. Federal reimbursement for every nutritious meal and snack served. A 60-child center can receive $30,000–$60,000+ per year.",
    tier: "essential",
    status: "ongoing",
    difficulty: "Easy",
    recurring: true,
  },
  {
    id: 2,
    name: "Child Care Services (CCS) Provider Enrollment",
    source: "Texas Workforce Commission",
    amount: "Ongoing subsidy payments per child",
    deadline: "Open enrollment",
    eligibility: "Licensed centers willing to accept subsidized children",
    description:
      "Enroll as a CCS provider to accept state-subsidized children. Provides steady, guaranteed revenue for each qualifying child in your care.",
    tier: "essential",
    status: "ongoing",
    difficulty: "Easy",
    recurring: true,
  },
  {
    id: 3,
    name: "Texas Rising Star Certification",
    source: "Texas Workforce Commission",
    amount: "Up to 9% higher reimbursement rates",
    deadline: "Ongoing — apply through local Workforce Board",
    eligibility: "Licensed CCS-enrolled centers",
    description:
      "Earn 2-Star, 3-Star, or 4-Star quality certification. Each level unlocks higher CCS reimbursement rates and access to exclusive grants like Pre-K Partnership.",
    tier: "essential",
    status: "ongoing",
    difficulty: "Medium",
    recurring: true,
  },

  // === GROWTH & IMPROVEMENT ===
  {
    id: 4,
    name: "Pre-K Partnership Grants",
    source: "Texas Workforce Commission",
    amount: "Up to $25,000",
    deadline: "Check TWC for current cycle",
    eligibility: "Texas Rising Star 3- or 4-Star rated providers",
    description:
      "Covers start-up costs for new pre-K classrooms in partnership with local school districts. Requires quality certification.",
    tier: "growth",
    status: "open",
    difficulty: "Hard",
    recurring: false,
  },
  {
    id: 5,
    name: "FCCN Start-Up Mini-Grants",
    source: "Texas Family Child Care Network / TWC",
    amount: "Up to $15,000",
    deadline: "Until 200 recipients funded",
    eligibility: "New or advancing family childcare providers",
    description:
      "Direct deposit grant for new family childcare providers seeking licensure or those advancing their permit type.",
    tier: "growth",
    status: "open",
    difficulty: "Easy",
    recurring: false,
  },
  {
    id: 6,
    name: "Head Start / Early Head Start",
    source: "Federal Office of Head Start",
    amount: "Varies — large competitive awards",
    deadline: "Federal grant cycles",
    eligibility: "Public/private nonprofit and for-profit agencies",
    description:
      "Comprehensive federal funding covering program operations, facility improvements, staff salaries, and educational materials for centers serving low-income children under 5.",
    tier: "growth",
    status: "upcoming",
    difficulty: "Hard",
    recurring: true,
  },
  {
    id: 7,
    name: "USDA Rural Development — Community Facilities Grant",
    source: "U.S. Department of Agriculture",
    amount: "Varies by project",
    deadline: "Rolling applications",
    eligibility: "Centers in rural areas (population < 20,000)",
    description:
      "Grants and low-interest loans for purchasing, constructing, or improving childcare facilities. Covers equipment and project expenses in rural Texas communities.",
    tier: "growth",
    status: "open",
    difficulty: "Medium",
    recurring: false,
  },
  {
    id: 8,
    name: "TWC Skills for Small Business",
    source: "Texas Workforce Commission",
    amount: "Up to $900/existing employee, $1,800/new hire",
    deadline: "Ongoing",
    eligibility: "Centers with fewer than 100 employees",
    description:
      "Reimburses training costs for staff at local community and technical colleges. Covers courses for both new and existing employees.",
    tier: "growth",
    status: "ongoing",
    difficulty: "Easy",
    recurring: true,
  },
  {
    id: 9,
    name: "T3C Readiness Grants",
    source: "TWC / TACFS",
    amount: "Varies by project scope",
    deadline: "3 cycles per year",
    eligibility: "Licensed residential childcare providers",
    description:
      "Supports readiness activities to meet T3C service array credentialing requirements. Three application windows each fiscal year.",
    tier: "growth",
    status: "open",
    difficulty: "Medium",
    recurring: false,
  },

  // === STAFF DEVELOPMENT ===
  {
    id: 10,
    name: "T.E.A.C.H. Early Childhood Texas Scholarships",
    source: "State of Texas",
    amount: "Full tuition for degree coursework",
    deadline: "Rolling applications",
    eligibility: "Early childhood educators in licensed settings",
    description:
      "Pays for college courses toward CDA credentials, associate's, or bachelor's degrees in early childhood education. Includes compensation support.",
    tier: "staff",
    status: "ongoing",
    difficulty: "Easy",
    recurring: true,
  },
  {
    id: 11,
    name: "CDA Scholarship Program",
    source: "Workforce Solutions (regional)",
    amount: "Full tuition + books",
    deadline: "Annual cycle (Feb typical)",
    eligibility: "Staff at Texas Rising Star certified/pursuing centers",
    description:
      "Covers the full cost of Child Development Associate credential coursework and materials through regional Workforce Solutions offices.",
    tier: "staff",
    status: "upcoming",
    difficulty: "Easy",
    recurring: false,
  },
  {
    id: 12,
    name: "Preschool Development Grant (PDG B-5)",
    source: "Federal HHS / TWC",
    amount: "Varies — state-level allocation",
    deadline: "State-administered cycles",
    eligibility: "Programs serving birth through age 5",
    description:
      "Federal funding distributed through TWC to improve coordination, quality, and access of early childhood programs statewide.",
    tier: "staff",
    status: "upcoming",
    difficulty: "Hard",
    recurring: false,
  },

  // === PRIVATE FOUNDATIONS ===
  {
    id: 13,
    name: "The Meadows Foundation",
    source: "Private Foundation (Dallas)",
    amount: "Varies by project",
    deadline: "Rolling applications",
    eligibility: "Texas-based childcare organizations",
    description:
      "One of Texas' largest foundations. Funds educational programs, facility quality improvements, and staff training initiatives for childcare centers.",
    tier: "foundation",
    status: "open",
    difficulty: "Medium",
    recurring: false,
  },
  {
    id: 14,
    name: "PNC Foundation — Grow Up Great",
    source: "PNC Foundation",
    amount: "Varies by project",
    deadline: "Check PNC Foundation website",
    eligibility: "Providers in PNC service areas in Texas",
    description:
      "Funds curriculum development, teacher training, and classroom resource purchases focused on school readiness for underserved children.",
    tier: "foundation",
    status: "open",
    difficulty: "Medium",
    recurring: false,
  },
  {
    id: 15,
    name: "The Powell Foundation",
    source: "Private Foundation",
    amount: "Varies by project",
    deadline: "Rolling applications",
    eligibility: "Childcare providers in Houston, Austin, or Dallas",
    description:
      "Supports initiatives that measurably improve child development outcomes in major Texas metro areas.",
    tier: "foundation",
    status: "open",
    difficulty: "Medium",
    recurring: false,
  },
  {
    id: 16,
    name: "Sid Richardson Foundation",
    source: "Private Foundation (Fort Worth)",
    amount: "Varies by project",
    deadline: "Letter of inquiry process",
    eligibility: "Texas nonprofits serving children",
    description:
      "Funds education, health, and human service initiatives for Texas residents. Strong focus on Fort Worth / North Texas region.",
    tier: "foundation",
    status: "open",
    difficulty: "Hard",
    recurring: false,
  },
];
