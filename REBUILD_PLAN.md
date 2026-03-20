# Rebuild Plan: GrantReady → TRS Certification Roadmap

## What stays
- Supabase auth + database infrastructure
- AI draft/transcribe/coherence API routes
- Stripe checkout/webhook routes
- VoiceMemoRecorder component

## What changes

### Phase A: New Landing Page + Quiz
- Replace landing page with money-focused headline
- Build quiz flow (9 questions, one per screen, no auth)
- Store quiz answers in localStorage until account creation

### Phase B: Funding Snapshot
- Calculate missing revenue from quiz answers (CCS count × rate differential)
- Show dollar amount prominently
- "Create free account" CTA at bottom

### Phase C: TRS Checklist Dashboard
- Replace grant-list dashboard with prioritized task checklist
- Tasks derived from TRS certification requirements
- Progress bar with dollar motivation
- Document tasks link to existing AI generation flow
- Each task: checkbox, title, context line, effort indicator, action button

### Phase D: Staff Tracker
- New /staff page: table of staff members
- Fields: name, role, CPR expiry, credential type, training hours
- Gap calculations: who needs what
- Alerts surface as dashboard tasks

### Phase E: Connect Document Generation
- Existing /apply/[grantId]/[sectionType] flow adapted for TRS documents
- Documents: curriculum framework, parent engagement policy, director quals, staff quals
- Same AI pipeline: voice/text → sufficiency check → draft → claim verification

### Phase F: Update Pricing
- Change from $199 to $49/month
- Update Stripe price ID
- Free tier: snapshot + checklist + 3 docs/month
- Pro: unlimited docs + room check + auto-fill + concierge

## Database changes needed
- staff_members table (name, role, center_id, cpr_expiry, credential_type, training_hours, email, phone)
- trs_tasks table (or static in code for MVP)
- Update centers with quiz data fields
