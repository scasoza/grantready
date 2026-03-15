import Link from "next/link";

const grants = [
  {
    name: "T3C Readiness Grants",
    source: "TWC / TACFS",
    amount: "Varies by project",
    deadline: "Rolling (3 cycles/year)",
    eligibility: "Licensed residential childcare providers",
    description:
      "Supports readiness activities to meet T3C service array credentialing requirements.",
  },
  {
    name: "Pre-K Partnership Grants",
    source: "Texas Workforce Commission",
    amount: "Up to $25,000",
    deadline: "Check TWC for current cycle",
    eligibility: "Texas Rising Star 3- or 4-Star rated providers",
    description:
      "Start-up costs for new pre-k partnership classrooms in collaboration with school districts.",
  },
  {
    name: "CACFP Meal Reimbursement",
    source: "USDA / Texas Dept of Agriculture",
    amount: "Per-meal reimbursement (ongoing)",
    deadline: "Open enrollment",
    eligibility: "Licensed childcare centers serving qualifying children",
    description:
      "Federal reimbursement for nutritious meals and snacks served to enrolled children.",
  },
  {
    name: "Texas Rising Star Quality Incentives",
    source: "Texas Workforce Commission",
    amount: "Tiered by star level",
    deadline: "Ongoing",
    eligibility: "Licensed centers accepting subsidized children",
    description:
      "Financial incentives for meeting quality benchmarks in teacher qualifications, curriculum, and environment.",
  },
  {
    name: "FCCN Start-Up Mini-Grants",
    source: "Texas Family Child Care Network / TWC",
    amount: "Up to $15,000",
    deadline: "Until 200 recipients funded",
    eligibility: "New or advancing family childcare providers",
    description:
      "Supports new family childcare providers seeking registration or licensure.",
  },
  {
    name: "CDA Scholarship Program",
    source: "Workforce Solutions (regional)",
    amount: "Full tuition + books",
    deadline: "Annual cycle (Feb typical)",
    eligibility: "Staff at Texas Rising Star certified centers",
    description:
      "Covers cost of Child Development Associate credential coursework and materials.",
  },
  {
    name: "Preschool Development Grant (PDG B-5)",
    source: "Federal HHS / TWC",
    amount: "Varies",
    deadline: "State-administered",
    eligibility: "Programs serving birth through age 5",
    description:
      "Federal funding to improve coordination and quality of early childhood programs statewide.",
  },
];

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-xl font-bold text-emerald-400">GrantReady</span>
        <div className="flex gap-4 items-center">
          <a href="#grants" className="text-sm text-gray-400 hover:text-white">
            Grants
          </a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-white">
            Pricing
          </a>
          <Link
            href="/dashboard"
            className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-emerald-900/40 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Now available for Texas childcare centers
        </div>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          Stop spending 30 hours
          <br />
          on grant applications.
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          GrantReady finds every childcare grant you qualify for, tracks
          deadlines, and drafts your applications with AI. What used to take 30
          hours now takes 4.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/dashboard"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg text-lg font-medium transition"
          >
            Start Free Trial
          </Link>
          <a
            href="#how-it-works"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg text-lg transition"
          >
            See How It Works
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          No credit card required. 14-day free trial.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { stat: "$15K", label: "Average grant won per center" },
            { stat: "87%", label: "Less time on applications" },
            { stat: "12,000+", label: "Texas childcare centers eligible" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center"
            >
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {item.stat}
              </div>
              <div className="text-sm text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "We Find Your Grants",
              desc: "Our curated database tracks every childcare-specific grant in Texas — CCDF, CACFP, TWC, local foundations, and more. We match you based on your center's profile.",
            },
            {
              step: "2",
              title: "AI Drafts Your Application",
              desc: "Upload your center info once. GrantReady pre-fills budgets, drafts narrative sections, and formats everything to each grant's requirements.",
            },
            {
              step: "3",
              title: "Review, Submit, Win",
              desc: "You review the AI draft, make edits, and submit. We track your application status and remind you about reporting deadlines if you win.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="grants" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">
          Texas Childcare Grants
        </h2>
        <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">
          Here are just some of the grants we track. Sign up to see which ones
          your center qualifies for.
        </p>
        <div className="grid gap-4">
          {grants.map((grant) => (
            <div
              key={grant.name}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-emerald-800 transition"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {grant.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {grant.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      {grant.source}
                    </span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      {grant.eligibility}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-emerald-400 font-bold text-lg">
                    {grant.amount}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {grant.deadline}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-gray-400 text-center mb-10">
          One plan. Everything included. Pays for itself with a single grant.
        </p>
        <div className="max-w-md mx-auto bg-gray-900 border border-emerald-800 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold">
              $199
              <span className="text-lg text-gray-400 font-normal">/month</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              14-day free trial. Cancel anytime.
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              "Curated grant database for your state",
              "Deadline tracking & reminders",
              "AI-drafted narratives & budgets",
              "Pre-filled applications from your center profile",
              "Submission tracking & reporting reminders",
              "Unlimited grant applications",
            ].map((feature) => (
              <li key={feature} className="flex gap-3 text-sm text-gray-300">
                <CheckIcon />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-medium transition"
          >
            Start Free Trial
          </Link>
          <p className="text-xs text-gray-500 text-center mt-3">
            One $10K grant pays for 4+ years of GrantReady.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to stop leaving money on the table?
        </h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Texas childcare centers are eligible for thousands in grants every
          year. Most directors miss them because the process is overwhelming.
          GrantReady changes that.
        </p>
        <Link
          href="/dashboard"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg text-lg font-medium transition"
        >
          Get Started Free
        </Link>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-500">
        <span className="text-emerald-400 font-semibold">GrantReady</span>{" "}
        &copy; {new Date().getFullYear()}. Helping childcare directors win more
        grants.
      </footer>
    </div>
  );
}
