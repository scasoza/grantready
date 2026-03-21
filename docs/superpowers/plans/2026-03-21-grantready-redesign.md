# GrantReady Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform GrantReady from a static checklist into a TRS certification copilot that generates documents, tracks staff compliance, validates the package, and enables concierge submission.

**Architecture:** Dashboard becomes a three-zone shrinking work queue. TRS documents stored in existing `applications`/`application_sections` tables with `grant_id="trs"`. New `/trs/[docType]` route reuses the section editor UI pattern. Admin panel at `/admin` for concierge workflow. Generation metering on `centers` table.

**Tech Stack:** Next.js 16, Tailwind CSS v4, Supabase (PostgreSQL + Auth), Gemini 3 Flash (`@google/genai`), `@react-pdf/renderer`, Stripe

**Spec:** `docs/superpowers/specs/2026-03-21-grantready-redesign.md`

---

## File Structure

### New Files
- `src/lib/trs-documents.ts` — TRS document template definitions (prompts, sub-prompts, auto-included data)
- `src/lib/trs-zones.ts` — Zone classification logic for dashboard tasks
- `src/lib/staff-utils.ts` — Shared staff data parsing and compliance checking (used by dashboard, doc gen, readiness)
- `src/app/dashboard/page.tsx` — Complete rewrite: three-zone shrinking work queue
- `src/app/trs/[docType]/page.tsx` — TRS document generation page (voice/text input → AI draft → claim verification)
- `src/app/trs/readiness/page.tsx` — Readiness report page
- `src/app/admin/page.tsx` — Admin submission list
- `src/app/admin/[submissionId]/page.tsx` — Admin submission detail
- `src/app/api/readiness-check/route.ts` — Readiness validation API
- `src/app/api/export-pdf/route.ts` — PDF export API

### Modified Files
- `src/lib/trs-tasks.ts` — Add `zone` field to `TrsTask` type
- `src/app/api/draft-section/route.ts` — Add generation metering
- `src/middleware.ts` — Add `/trs/:path*` and `/admin/:path*` protection

### Database Changes (via Supabase dashboard or migration)
- `application_sections`: Add column `input_hash` (text, nullable)
- `centers`: Add columns `ai_generations_this_month` (integer, default 0), `generation_month` (integer, default 0)
- New table `submissions`: `id` (uuid PK), `center_id` (integer FK), `status` (text, default 'pending'), `requested_at` (timestamptz), `completed_at` (timestamptz), `notes` (text)

---

## Task 1: Database Schema Changes

**Files:**
- Create: `supabase/migrations/004_redesign_schema.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Add input_hash to application_sections for staleness detection
ALTER TABLE application_sections ADD COLUMN IF NOT EXISTS input_hash text;

-- Add generation metering to centers
ALTER TABLE centers ADD COLUMN IF NOT EXISTS ai_generations_this_month integer DEFAULT 0;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS generation_month integer DEFAULT 0;

-- Submissions table for concierge workflow
CREATE TABLE IF NOT EXISTS submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id integer REFERENCES centers(id) NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  requested_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  notes text
);

-- RLS for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (
    center_id IN (SELECT id FROM centers WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own submissions" ON submissions
  FOR INSERT WITH CHECK (
    center_id IN (SELECT id FROM centers WHERE user_id = auth.uid())
  );

-- Admin can do everything (service role bypasses RLS)
```

- [ ] **Step 2: Apply migration via Supabase dashboard**

Go to Supabase SQL Editor and run the migration. Alternatively run:
```bash
cd /home/saulo/Desktop/grantready
npx supabase db push
```

- [ ] **Step 3: Commit**

```bash
cd /home/saulo/Desktop/grantready
git add supabase/migrations/004_redesign_schema.sql
git commit -m "feat: add schema for redesign — submissions table, metering, input_hash"
```

---

## Task 2: Shared Libraries — Staff Utils, TRS Documents, Zone Logic

**Files:**
- Create: `src/lib/staff-utils.ts`
- Create: `src/lib/trs-documents.ts`
- Create: `src/lib/trs-zones.ts`
- Modify: `src/lib/trs-tasks.ts`

- [ ] **Step 1: Create `src/lib/staff-utils.ts`**

Shared staff parsing and compliance checking. Extracted from `staff/page.tsx` patterns.

```typescript
export interface StaffMember {
  id: string;
  name: string;
  role: string;
  hireDate: string;
  cprExpiry: string;
  credentialType: "none" | "cda" | "associates" | "bachelors" | "masters";
  trainingHours: number;
  email: string;
}

export interface StaffAlert {
  staffName: string;
  type: "cpr_expiring" | "cpr_expired" | "low_training" | "no_credential";
  message: string;
  daysUntilExpiry?: number;
}

export function parseStaffMembers(raw: string | null): StaffMember[] {
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

export function daysUntil(dateString: string): number | null {
  if (!dateString) return null;
  const target = new Date(dateString + "T00:00:00");
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getStaffAlerts(staff: StaffMember[]): StaffAlert[] {
  const alerts: StaffAlert[] = [];
  for (const member of staff) {
    const days = daysUntil(member.cprExpiry);
    if (days !== null && days < 0) {
      alerts.push({
        staffName: member.name,
        type: "cpr_expired",
        message: `${member.name}'s CPR certification expired ${Math.abs(days)} days ago`,
        daysUntilExpiry: days,
      });
    } else if (days !== null && days <= 30) {
      alerts.push({
        staffName: member.name,
        type: "cpr_expiring",
        message: `${member.name}'s CPR expires in ${days} days`,
        daysUntilExpiry: days,
      });
    }
    if (member.trainingHours < 24) {
      alerts.push({
        staffName: member.name,
        type: "low_training",
        message: `${member.name} has ${member.trainingHours}/24 required training hours`,
      });
    }
    if (member.credentialType === "none") {
      alerts.push({
        staffName: member.name,
        type: "no_credential",
        message: `${member.name} has no documented credential`,
      });
    }
  }
  return alerts;
}

export function isStaffCompliant(staff: StaffMember[]): boolean {
  if (staff.length === 0) return false;
  return staff.every((m) => {
    const days = daysUntil(m.cprExpiry);
    return (
      days !== null && days > 0 &&
      m.trainingHours >= 24 &&
      m.credentialType !== "none"
    );
  });
}
```

- [ ] **Step 2: Create `src/lib/trs-documents.ts`**

TRS document template definitions.

```typescript
export interface TrsDocTemplate {
  docType: string;
  title: string;
  prompt: string;
  subPrompts: string[];
  autoIncludedData: string[]; // keys to pull from center/staff data
  requiresDirectorInput: boolean;
}

export const trsDocTemplates: TrsDocTemplate[] = [
  {
    docType: "curriculum_framework",
    title: "Curriculum Framework",
    prompt:
      "Describe a typical day at your center. What do kids do from drop-off to pick-up?",
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
    prompt:
      "How do you communicate with parents? What do you do to involve families?",
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
    prompt:
      "What are the biggest things you want to improve at your center this year?",
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
    prompt:
      "What are your learning goals for this week? What activities are planned?",
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
    prompt:
      "Describe your education, certifications, and childcare experience.",
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
```

- [ ] **Step 3: Create `src/lib/trs-zones.ts`**

Zone classification for dashboard.

```typescript
import type { TrsTask } from "./trs-tasks";
import type { StaffAlert } from "./staff-utils";

export type Zone = "attention" | "paperwork" | "prep";

export function getTaskZone(task: TrsTask): Zone | null {
  // submit-application is replaced by concierge CTA
  if (task.id === "submit-application") return null;

  // Document generation tasks → Zone 2 (paperwork)
  if (task.action?.type === "generate-doc") return "paperwork";
  if (task.action?.type === "self-assessment") return "paperwork";

  // Everything else → Zone 3 (prep)
  return "prep";
}

export interface AttentionItem {
  id: string;
  type: "staff_alert" | "stale_document";
  title: string;
  message: string;
  actionHref: string;
}

export function getAttentionItems(
  staffAlerts: StaffAlert[],
  staleDocs: { docType: string; title: string }[]
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const alert of staffAlerts) {
    items.push({
      id: `staff-${alert.staffName}-${alert.type}`,
      type: "staff_alert",
      title: alert.staffName,
      message: alert.message,
      actionHref: "/staff",
    });
  }

  for (const doc of staleDocs) {
    items.push({
      id: `stale-${doc.docType}`,
      type: "stale_document",
      title: doc.title,
      message: `${doc.title} may need regeneration — underlying data changed`,
      actionHref: `/trs/${doc.docType}`,
    });
  }

  return items;
}
```

- [ ] **Step 4: Add `zone` field to `TrsTask` in `src/lib/trs-tasks.ts`**

Add to the `TrsTask` interface after `action`:

```typescript
zone?: "paperwork" | "prep"; // overrides computed zone from getTaskZone
```

No need to set it on individual tasks — `getTaskZone()` computes it from `action.type`.

- [ ] **Step 5: Commit**

```bash
cd /home/saulo/Desktop/grantready
git add src/lib/staff-utils.ts src/lib/trs-documents.ts src/lib/trs-zones.ts src/lib/trs-tasks.ts
git commit -m "feat: add shared libs for staff utils, TRS doc templates, zone logic"
```

---

## Task 3: Update Middleware

**Files:**
- Modify: `src/middleware.ts` (line ~50, config matcher)

- [ ] **Step 1: Add `/trs/:path*` and `/admin/:path*` to the middleware matcher**

In `src/middleware.ts`, update the `config.matcher` array to include the new routes:

```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/app/:path*",
    "/staff/:path*",
    "/apply/:path*",
    "/documents/:path*",
    "/onboarding/:path*",
    "/trs/:path*",
    "/admin/:path*",
  ],
};
```

- [ ] **Step 2: Add admin email check for `/admin` routes**

In the middleware function, after the auth check, add admin protection:

```typescript
// After the existing auth redirect block:
const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
if (isAdminRoute) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/saulo/Desktop/grantready
git add src/middleware.ts
git commit -m "feat: protect /trs and /admin routes in middleware"
```

---

## Task 4: Generation Metering in Draft Section API

**Files:**
- Modify: `src/app/api/draft-section/route.ts` (after auth check, ~line 77)

- [ ] **Step 1: Add metering logic after the auth check**

After the existing `if (!user)` block, add:

```typescript
// Generation metering for free-tier users
const supabaseAdmin = await createClient();
const { data: centerRow } = await supabaseAdmin
  .from("centers")
  .select("id, subscription_status, ai_generations_this_month, generation_month")
  .eq("user_id", user.id)
  .limit(1)
  .single();

if (centerRow && centerRow.subscription_status !== "active") {
  const currentMonth = Number(
    new Date().toISOString().slice(0, 7).replace("-", "")
  );
  let count = centerRow.ai_generations_this_month ?? 0;
  if ((centerRow.generation_month ?? 0) !== currentMonth) {
    count = 0; // reset for new month
  }
  if (count >= 3) {
    return NextResponse.json(
      { error: "Free tier limit reached (3/month). Upgrade to Pro for unlimited generations." },
      { status: 403 }
    );
  }
  // Increment counter
  await supabaseAdmin
    .from("centers")
    .update({
      ai_generations_this_month: count + 1,
      generation_month: currentMonth,
    })
    .eq("id", centerRow.id);
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/saulo/Desktop/grantready
git add src/app/api/draft-section/route.ts
git commit -m "feat: add free-tier generation metering (3/month)"
```

---

## Task 5: TRS Document Generation Page

**Files:**
- Create: `src/app/trs/[docType]/page.tsx`

This page reuses the section editor patterns from `apply/[grantId]/[sectionType]/page.tsx` but simplified for TRS documents.

- [ ] **Step 1: Create the TRS document generation page**

The page should:
1. Load the TRS doc template from `trs-documents.ts` using the `docType` param
2. Get or create a TRS application (`grant_id = "trs"`) for the center
3. Get or create the `application_sections` row for this `docType`
4. Show the input form with the template's prompt and sub-prompts
5. Include VoiceMemoRecorder for voice input
6. Call `/api/draft-section` with template data + center data + staff data
7. Show generated draft with claim verification
8. Save verified document and compute `input_hash`

Key differences from the grant section editor:
- Uses `getTrsDocTemplate(docType)` instead of `getSectionsForGrant(grantId)`
- For `staff_binder` (no director input): auto-generates immediately from staff data
- Stores `input_hash` = simple hash of the center/staff data used
- Back button goes to `/dashboard` not `/apply/[grantId]`

The page is approximately 400 lines. Model it closely on `src/app/apply/[grantId]/[sectionType]/page.tsx` but with these substitutions:
- `params.grantId` → not needed (always TRS)
- `params.sectionType` → `params.docType`
- Section template lookup → `getTrsDocTemplate(params.docType)`
- Grant ID for application lookup → `"trs"`
- Navigation → `/dashboard` instead of `/apply/[grantId]`
- Add `input_hash` save on document verification

- [ ] **Step 2: Verify the page loads**

```bash
cd /home/saulo/Desktop/grantready && npm run dev
```

Navigate to `http://localhost:3000/trs/curriculum_framework` — should show the input form.

- [ ] **Step 3: Test document generation end-to-end**

Enter text input for curriculum framework, click generate, verify claims, approve. Check that `application_sections` row is created with `grant_id="trs"`.

- [ ] **Step 4: Commit**

```bash
cd /home/saulo/Desktop/grantready
git add src/app/trs/
git commit -m "feat: add TRS document generation page at /trs/[docType]"
```

---

## Task 6: Dashboard Rewrite — Three-Zone Shrinking Work Queue

**Files:**
- Modify: `src/app/dashboard/page.tsx` (complete rewrite, ~319 lines → ~400 lines)

- [ ] **Step 1: Rewrite the dashboard**

The new dashboard must:

1. **Load data:**
   - User + center from Supabase
   - Completed tasks from `center_data` (key: `"completed_tasks"`)
   - Staff members from `center_data` (key: `"staff_members"`)
   - TRS application sections from `application_sections` where `grant_id = "trs"` (via `applications` join)
   - Submission status from `submissions` table

2. **Compute zones:**
   - Use `getTaskZone()` from `trs-zones.ts` to classify each task
   - Use `getStaffAlerts()` from `staff-utils.ts` for Zone 1
   - Check TRS doc generation status for Zone 2 card states
   - Compare `input_hash` on generated docs vs current data for staleness → Zone 1

3. **Render three zones:**
   - **Zone 1 "Needs your attention":** Staff alerts + stale document warnings. Each item links to fix action.
   - **Zone 2 "Your paperwork":** Cards for each `generate-doc` / `self-assessment` task. Show status (Not started / Generated). Tap → `/trs/[docType]`. Hide completed ones.
   - **Zone 3 "Your center prep":** Physical/admin/training tasks. Toggle done/not-done. Hide completed ones.

4. **Progress bar:** "X of Y complete" counting: generated docs + compliant staff tasks + completed prep tasks

5. **Collapsed completed section:** "Show N completed tasks" toggle at bottom

6. **Submission CTA:** Appears when all tasks done. Links to `/trs/readiness` (Pro) or shows upgrade prompt (Free).

7. **Submission status banner:** If a submission exists with status "pending", show "Your application has been submitted — we're handling it." If "completed", show "Your TRS application was submitted to your Workforce Board."

- [ ] **Step 2: Test the dashboard**

Navigate to `http://localhost:3000/dashboard`. Verify:
- Three zones render with correct task classification
- Staff alerts appear in Zone 1
- Document cards link to `/trs/[docType]`
- Completed tasks disappear into collapsed section
- Progress bar updates correctly

- [ ] **Step 3: Commit**

```bash
cd /home/saulo/Desktop/grantready
git add src/app/dashboard/page.tsx
git commit -m "feat: rewrite dashboard as three-zone shrinking work queue"
```

---

## Task 7: Readiness Report Page + API

**Files:**
- Create: `src/app/api/readiness-check/route.ts`
- Create: `src/app/trs/readiness/page.tsx`

- [ ] **Step 1: Create the readiness check API**

`/api/readiness-check` POST endpoint. Accepts `{ centerId }`. Returns:

```typescript
{
  checks: {
    category: "documents" | "staff" | "consistency";
    label: string;
    passed: boolean;
    detail: string; // e.g., "Curriculum framework verified" or "Juan needs 4 more hours"
    fixHref?: string; // link to fix
  }[];
  summary: { total: number; passed: number; failed: number };
}
```

**Document checks:**
- For each TRS doc template: does a verified `application_sections` row exist?
- Is `ai_draft` > 200 words?
- Does `ai_draft` contain placeholder patterns? (`/\[(insert|your|TBD|TODO)/i`)
- Are all `verified_claims` for this section marked verified?

**Staff checks:**
- Parse staff from `center_data`
- All CPR current?
- All training >= 24 hours?
- Director credential documented?
- All have credential type != "none"?

**Consistency checks:**
- Call existing `/api/review-coherence` internally with all TRS drafts
- Report any issues

- [ ] **Step 2: Create the readiness report page**

`/trs/readiness` page that:
1. Calls `/api/readiness-check` on load
2. Displays checks grouped by category
3. Each check: green checkmark or red X + description
4. Failed checks link to fix (staff tracker or `/trs/[docType]`)
5. Summary at top: "X of Y checks passed"
6. If all pass: show "Submit my application" button
7. Submit button creates a `submissions` row with status "pending"
8. After submission: redirect to dashboard (which shows the status banner)

- [ ] **Step 3: Test the readiness report**

Navigate to `/trs/readiness`. Verify checks render, failed items link to fixes.

- [ ] **Step 4: Commit**

```bash
cd /home/saulo/Desktop/grantready
git add src/app/api/readiness-check/ src/app/trs/readiness/
git commit -m "feat: add readiness report with validation checks and submission"
```

---

## Task 8: Admin Panel

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/[submissionId]/page.tsx`

- [ ] **Step 1: Set ADMIN_EMAIL env var**

Add to `.env.local`:
```
ADMIN_EMAIL=inglescomsaulo@gmail.com
```

Add to Vercel environment variables as well.

- [ ] **Step 2: Create admin submissions list page**

`/admin` page that:
1. Fetches all submissions with status "pending" (using service role or admin check)
2. For each: shows center name, director email, requested date
3. Links to `/admin/[submissionId]` detail page

Since we need to read across users, use a server-side Supabase client with the service role key, or use the admin user's session with a query that joins submissions → centers → auth.users. For MVP, use the logged-in user's session and a Supabase function or a simple approach: fetch submissions, then for each fetch the center and user email.

- [ ] **Step 3: Create admin submission detail page**

`/admin/[submissionId]` page that:
1. Loads the submission + center + user data
2. Loads all TRS `application_sections` for this center (where application `grant_id = "trs"`)
3. Loads staff data from `center_data`
4. Renders each generated document (title + full draft text)
5. Renders staff summary table
6. Renders center info
7. "Mark as completed" button → updates `submissions.status = "completed"`, `completed_at = now()`

- [ ] **Step 4: Test admin panel**

Log in as admin email. Navigate to `/admin`. Verify submissions appear and detail page shows all data.

- [ ] **Step 5: Commit**

```bash
cd /home/saulo/Desktop/grantready
git add src/app/admin/
git commit -m "feat: add admin panel for concierge submission workflow"
```

---

## Task 9: PDF Export API

**Files:**
- Create: `src/app/api/export-pdf/route.ts`

- [ ] **Step 1: Install @react-pdf/renderer**

```bash
cd /home/saulo/Desktop/grantready
npm install @react-pdf/renderer
```

- [ ] **Step 2: Create the PDF export API route**

`/api/export-pdf` GET endpoint. Query params: `docType`, `applicationId`.

1. Read the `application_sections` row by `application_id` + `section_type`
2. Read center data for header info
3. For `staff_binder`: read staff data, render one page per staff member
4. For all others: render the `ai_draft` as styled paragraphs
5. Return PDF as `application/pdf` with `Content-Disposition: attachment`

Use `@react-pdf/renderer`'s `renderToStream` for server-side generation:

```typescript
import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
```

Build a React component tree, render to stream, return as Response.

- [ ] **Step 3: Add download button to TRS document page**

In `src/app/trs/[docType]/page.tsx`, when document is verified, show a "Download PDF" button that opens `/api/export-pdf?docType=X&applicationId=Y`.

- [ ] **Step 4: Test PDF download**

Generate a document, verify it, click download. Confirm PDF opens with formatted content.

- [ ] **Step 5: Commit**

```bash
cd /home/saulo/Desktop/grantready
git add src/app/api/export-pdf/ src/app/trs/
git commit -m "feat: add PDF export for TRS documents"
```

---

## Task 10: Update Pricing Page + Deploy

**Files:**
- Modify: `src/app/pricing/page.tsx`

- [ ] **Step 1: Update pricing page copy**

Update `freeFeatures` and `proFeatures` arrays to match the spec:

```typescript
const freeFeatures = [
  "Funding snapshot with dollar estimate",
  "Full TRS certification dashboard",
  "Staff credential tracker",
  "3 AI document generations per month",
  "Expiration alerts on dashboard",
];

const proFeatures = [
  "Everything in Free, plus:",
  "Unlimited AI document generation",
  "Readiness report with cross-document validation",
  "Concierge application submission",
  "Printable staff credentials binder",
];
```

- [ ] **Step 2: Final integration test**

Walk through the full flow:
1. Landing → quiz → snapshot → signup
2. Dashboard shows three zones
3. Generate a TRS document (curriculum framework)
4. Check staff tracker alerts on dashboard
5. View readiness report
6. Submit application (if all ready)
7. Check admin panel

- [ ] **Step 3: Commit and push**

```bash
cd /home/saulo/Desktop/grantready
git add src/app/pricing/page.tsx
git commit -m "feat: update pricing page copy for redesign"
git push origin master
```

---

## Summary

| Task | What it does | Dependencies |
|------|-------------|-------------|
| 1 | Database schema (submissions table, metering columns, input_hash) | None |
| 2 | Shared libraries (staff-utils, trs-documents, trs-zones) | None |
| 3 | Middleware (protect /trs and /admin routes) | None |
| 4 | Generation metering in draft-section API | Task 1 |
| 5 | TRS document generation page `/trs/[docType]` | Tasks 1, 2 |
| 6 | Dashboard rewrite (three-zone shrinking work queue) | Tasks 2, 5 |
| 7 | Readiness report page + API | Tasks 1, 2, 5 |
| 8 | Admin panel | Tasks 1, 7 |
| 9 | PDF export | Task 5 |
| 10 | Pricing page update + deploy | All |
