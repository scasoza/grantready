# GrantReady Redesign: TRS Certification Copilot

## Problem

The current app is a login + static checklist. Checking boxes does nothing. AI generation buttons show "coming soon." The staff tracker is disconnected. There's no reason to pay $49/mo for what a Google Doc could do.

## Product Direction

GrantReady becomes a "done-for-you" TRS certification tool. The app generates every document the director needs, tracks staff compliance, validates the full package, and hands off the final government portal submission to the operator (Saulo). Physical tasks (classroom setup, etc.) get clear descriptions but no over-engineering.

## Design

### 1. Dashboard: Shrinking Work Queue

Replace the flat 22-item checkbox list with a work queue that shrinks as tasks are completed. Completed tasks disappear from view (collapsed "Completed" section with a count: "14 of 22 done").

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

**Top:** Progress bar + "X of Y tasks complete."

**Bottom:** Submission CTA appears when all tasks are complete.

**Zone mapping from existing task categories:**
- `docs` tasks with `action.type === "generate-doc"` -> Zone 2 (Your paperwork)
- `room` tasks -> Zone 3 (Your center prep)
- `admin` tasks (except `self-assessment` and `submit-application`) -> Zone 3 (Your center prep / Administrative)
- `staff` tasks with `action.type === "staff-tracker"` -> Zone 1 when issues exist, otherwise Zone 3
- `staff` tasks with `action.type === "generate-doc"` -> Zone 2
- `training` tasks -> Zone 3
- `self-assessment` -> Zone 2 (it's a document/form the app helps fill)
- `submit-application` -> replaced by the concierge submission CTA

### 2. Document Generation Flow

Triggered from dashboard document cards. New route: `/trs/[docType]`. Reuses the existing section editor UI patterns and the `draft-section` API (Gemini 3 Flash sufficiency/writer/claims pipeline).

**Step 1: Input.** One screen with a prompt specific to the document type. Voice memo or text input. Sub-prompts listed as hints.

**Step 2: Sufficiency check.** AI evaluates if there's enough substance. If thin, asks a targeted follow-up question. If good, proceeds to drafting.

**Step 3: Generated document.** Full professional document appears. Factual claims highlighted for verification ("serves 42 children ages 2-5" — correct? yes/edit). Director verifies facts, not prose.

**Step 4: Done.** Document saved, downloadable as PDF. Dashboard card moves to completed.

#### TRS Document Templates

Each template defines: prompt (what to ask the director), sub-prompts (specific things to mention), system instructions (what the AI writer should produce), and what center/staff data to auto-include.

| docType | Prompt | Sub-prompts | Auto-included data |
|---------|--------|-------------|-------------------|
| `curriculum_framework` | "Describe a typical day at your center. What do kids do from drop-off to pick-up?" | Age groups served; daily schedule blocks; how transitions are handled; learning domains covered | Center name, licensed capacity, enrollment |
| `parent_engagement` | "How do you communicate with parents? What do you do to involve families?" | Communication methods (app, newsletter, conferences); family events; how you handle concerns; volunteer opportunities | Center name, enrollment |
| `cqip` | "What are the biggest things you want to improve at your center this year?" | Staff development goals; classroom environment improvements; family engagement goals; timeline for changes | Center name, staff count, data from curriculum_framework and parent_engagement docs |
| `weekly_objectives` | "What are your learning goals for this week? What activities are planned?" | Age-appropriate goals; connection to developmental domains; indoor and outdoor activities | Center name, age groups from curriculum_framework |
| `staff_binder` | No director input needed — auto-generated from staff tracker data | N/A | All staff records: names, roles, credentials, CPR dates, training hours |
| `director_qualifications` | "Describe your education, certifications, and childcare experience." | Degrees held; CDA or other credentials; years of experience; specialized training | Director name from center data |

#### Document Storage

TRS documents are stored in `application_sections` with a synthetic application. On first TRS document generation, create an `applications` row with `grant_id = "trs"` for the center. Each document type becomes a row in `application_sections` with `section_type` = the docType. This reuses the existing data model (ai_draft, status, verified_claims) without new tables.

#### Document Staleness

When a document is generated, store a hash of the input data (staff records, center info) used to generate it in the `application_sections` row (new column: `input_hash`). On dashboard load, compare current data hash to stored hash. If different, show the document in Zone 1 with "Staff data changed since this was generated — regenerate?"

### 3. Staff Tracker Integration

The staff page keeps its current UI. Staff data stays in `center_data` as a JSON blob for MVP — it's already parsed client-side and works. API routes that need staff data (document generation, readiness report) will read and parse the same blob server-side.

What changes:
- **Dashboard alerts:** Parse staff JSON on dashboard load. Surface expiring CPR (within 30 days), missing credentials, insufficient training hours in Zone 1.
- **Document generation:** Pass parsed staff data to the `draft-section` API as part of `centerData` for staff_binder and director_qualifications generation.
- **Blocking tasks:** Staff-related tasks in Zone 3 show as blocked if staff data indicates non-compliance.

### 4. Readiness Report

Before the submission CTA appears, directors see a review screen. This is a Pro feature.

**Validation checks (implemented as an API route `/api/readiness-check`):**

Document checks (per document):
- Document exists and has status "verified"
- AI draft is non-empty and exceeds 200 words (minimum substance)
- No placeholder patterns detected (regex for `[insert`, `[your`, `TBD`, `TODO`)
- Factual claims have been reviewed (all claims in verified_claims marked as verified or corrected)

Cross-document checks:
- Staff count mentioned consistently across documents (extract numbers, compare)
- Enrollment/capacity numbers consistent
- Center name consistent
- No contradictory claims (reuse existing `review-coherence` API with all TRS docs)

Staff checks:
- All staff have current CPR (expiry > today)
- All staff meet minimum training hours (24 hrs/year for TRS)
- Director credential documented
- All staff have credential type recorded (not "none")

**Display format:**
- Group by category (Documents, Staff, Consistency)
- Each check: green checkmark or red X with specific description
- Summary at top: "X of Y checks passed. Z items need attention."
- Items needing attention link directly to the fix (staff tracker, document regeneration, etc.)

### 5. Concierge Submission

**Director side:**
- When all tasks complete and readiness report passes, dashboard shows: "Submit my application"
- Tapping shows a summary of everything being submitted
- Director confirms
- Status changes to "Submitted — we're handling it"
- Director sees status update on dashboard when complete (in-app notification, not email for MVP)

**Data model:**
- New `submissions` table: `id`, `center_id`, `status` (pending/submitted/completed), `requested_at`, `completed_at`, `notes`
- Status values: `pending` (director confirmed) -> `completed` (operator submitted to portal)

**Admin side (`/admin`):**
- Protected by env var `ADMIN_EMAIL` — middleware checks logged-in user email against it
- List of pending submissions: center name, director email, date requested
- Each links to detail page: all generated TRS documents (rendered), staff data summary, center info
- "Mark as completed" button updates submission status; director sees update on next dashboard load

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
- Staff auto-email alerts for expiring certs (future)
- Room self-check tool (future)

**Generation metering:**
- New column on `centers` table: `ai_generations_this_month` (integer, default 0), `generation_month` (integer, YYYYMM format)
- On each `draft-section` API call: check subscription_status. If not "active", check counter. If `generation_month` !== current month, reset counter to 0. If counter >= 3, return 403 with upgrade prompt. Otherwise increment.
- Pro users (subscription_status = "active") bypass the counter entirely.

### 7. PDF Export

Use `@react-pdf/renderer` for server-side PDF generation. New API route `/api/export-pdf` that:
- Takes a document type and application ID
- Reads the ai_draft from application_sections
- Renders it as a styled PDF with center name, document title, date, and the content
- Returns the PDF as a downloadable response

For the staff binder, render one page per staff member with their credentials, CPR status, and training hours.

## Technical Notes

- Dashboard replaces current checkbox-based page entirely
- Document generation reuses existing AI drafting infrastructure (Gemini 3 Flash, sufficiency check, claim extraction)
- TRS documents stored in existing `applications` + `application_sections` tables with `grant_id = "trs"`
- Staff data stays as JSON blob in `center_data` for MVP
- Admin panel auth via `ADMIN_EMAIL` env var
- New DB columns: `application_sections.input_hash`, `centers.ai_generations_this_month`, `centers.generation_month`
- New table: `submissions` (id, center_id, status, requested_at, completed_at, notes)
- New routes: `/trs/[docType]`, `/trs/readiness`, `/admin`, `/admin/[submissionId]`, `/api/readiness-check`, `/api/export-pdf`
- Existing grant application flow (`/apply/[grantId]`) remains accessible from `/documents` page but is not the primary flow

## Out of Scope (for now)

- Room self-check tool (ECERS-3 questionnaire)
- Staff auto-email alerts (requires email service integration)
- Email notifications for submission status (in-app only for MVP)
- Comparison against successful applications
