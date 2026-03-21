# GrantReady Redesign: TRS Certification Copilot

## Problem

The current app is a login + static checklist. Checking boxes does nothing. AI generation buttons show "coming soon." The staff tracker is disconnected. There's no reason to pay $49/mo for what a Google Doc could do.

## Product Direction

GrantReady becomes a "done-for-you" TRS certification tool. The app generates every document the director needs, tracks staff compliance, validates the full package, and hands off the final government portal submission to the operator (Saulo). Physical tasks (classroom setup, etc.) get clear descriptions but no over-engineering.

## Design

### 1. Dashboard: Shrinking Work Queue

Replace the flat 22-item checkbox list with a work queue that shrinks as tasks are completed. Completed tasks disappear from view (collapsed "Completed" section or just a count: "14 of 22 done").

Three zones, shown only when they have items:

**Zone 1: "Needs your attention"**
- Staff with expiring CPR/credentials (live from staff tracker)
- Documents needing director input before AI can generate
- Cross-document inconsistencies detected
- This zone disappears when nothing needs action

**Zone 2: "Your paperwork" (app handles this)**
- Cards for each document task: curriculum framework, parent engagement policy, CQIP, weekly learning cards, staff credentials binder, self-assessment
- Each card shows status: Not started / Input needed / Generated / Downloaded
- Tapping starts the document generation flow or shows the generated doc
- Card disappears from active view once generated

**Zone 3: "Your center prep" (director does this)**
- Physical/action tasks with clear descriptions of what assessors look for
- Simple done/not-done toggle
- Grouped by location: Classroom, Outdoor, Administrative
- Task disappears from active view when marked done

**Top:** Progress bar + "X of Y tasks complete" (no revenue estimate — that was on the snapshot page already).

**Bottom:** Submission CTA appears when all tasks are complete.

### 2. Document Generation Flow

Triggered from dashboard document cards. Reuses the existing section editor architecture (`apply/[grantId]/[sectionType]`) adapted for TRS documents.

**Step 1: Input.** One screen with a prompt specific to the document type. Voice memo or text input. Sub-prompts listed as hints ("try to mention: age groups, daily schedule, transitions").

**Step 2: Sufficiency check.** AI evaluates if there's enough substance. If thin, asks a targeted follow-up question. If good, proceeds to drafting.

**Step 3: Generated document.** Full professional document appears. Factual claims highlighted for verification ("serves 42 children ages 2-5" — correct? yes/edit). Director verifies facts, not prose.

**Step 4: Done.** Document saved, downloadable as PDF. Dashboard card moves to completed. If underlying data changes later (e.g., new staff added), a flag appears suggesting the document may need regeneration.

### 3. Staff Tracker Integration

The staff page itself doesn't change much — it already captures name, role, hire date, CPR expiry, credential type, training hours, email. What changes is that this data now feeds the system:

- **Dashboard alerts:** Expiring CPR, missing credentials, insufficient training hours surface in the "Needs attention" zone
- **Document generation:** Staff data auto-populates into staff binder, credential summaries, and self-assessment fields
- **Blocking tasks:** If staff don't meet TRS requirements, relevant tasks show as blocked on the dashboard ("2 staff below required training hours — fix in Staff Tracker")

### 4. Readiness Report

Before the submission CTA appears, directors see a review screen that shows exactly what was validated. This builds trust in the AI-generated documents.

**Per document:**
- List of checks performed: "TRS Category X requirements met, consistent numbers across documents, no placeholder text, minimum length met"
- Flagged issues if any: "Curriculum framework mentions 6 learning centers but room setup says 5 — which is correct?"

**Staff compliance:**
- Summary: "All 8 staff have current CPR, 7 of 8 meet training hour minimum, Director credential documented"
- Blockers: "Juan needs 4 more training hours before submission"

**Overall package:**
- Confidence summary: "Your application package is complete and consistent. We checked 34 items across your documents and staff records. 2 items need your attention before submission."

The key principle: show the work. Don't just say "ready" — show what was checked and what passed.

### 5. Concierge Submission

**Director side:**
- When all tasks complete and readiness report passes, dashboard shows: "Submit my application"
- Tapping shows a summary of everything being submitted
- Director confirms
- Status changes to "Submitted — we're handling it"
- Director gets notified when submission is complete

**Admin side (`/admin`, protected to operator account):**
- List of pending submissions: center name, director email, date requested
- Each links to a detail page with all generated documents, staff data, center info
- "Mark as submitted" button sends email notification to director

### 6. Free vs Pro

**Free:**
- Quiz + funding snapshot (no account needed)
- Full dashboard with all tasks visible
- Staff tracker with data entry
- 3 AI document generations per month
- Expiration alerts visible on dashboard

**Pro ($49/mo):**
- Unlimited AI document generations
- Readiness report with cross-document validation
- Concierge submission
- Staff auto-email alerts for expiring certs
- Room self-check tool (future)

## Technical Notes

- Dashboard replaces current checkbox-based page entirely
- Document generation reuses existing AI drafting infrastructure (Gemini 3 Flash, sufficiency check, claim extraction)
- Staff tracker data needs to be queryable for dashboard alerts and document generation context
- Admin panel is a new route with simple auth check (operator email)
- Readiness report is a new API route that runs validation checks across all generated documents and staff data
- PDF export needed for generated documents

## Out of Scope (for now)

- Room self-check tool (ECERS-3 questionnaire)
- Staff auto-email alerts (requires email service integration)
- Grant application builder for non-TRS grants (existing flow stays but isn't the focus)
- Comparison against successful applications
