# GrantReady Implementation Plan

## Product Description
GrantReady helps Texas childcare center directors complete grant applications in ~35 minutes instead of 15-40 hours. The v7 UX uses a "Structured Conversation with Verification" model.

## Current State
- Next.js 16 + Tailwind landing page
- 16 Texas childcare grants in a static TypeScript file
- Eligibility checker
- File-based signup (no auth, no database)

## Phase 1: Supabase + Auth
- Install @supabase/supabase-js and @supabase/ssr
- Create Supabase project tables: centers, profiles
- Add Google OAuth + email/password auth
- Signup flow: email/Google → enter license # or center name → auto-lookup → done in 60 seconds
- Store center profile in Supabase
- Protected routes (dashboard, application builder)
- Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

## Phase 2: Database Schema
Tables needed:
- centers (id, name, license_number, address, city, zip, phone, email, enrollment_count, staff_count, created_at)
- grants (id, name, tier, amount_min, amount_max, deadline, eligibility_criteria, sections_template, scoring_rubric_notes)
- applications (id, center_id, grant_id, status, started_at, submitted_at)
- application_sections (id, application_id, section_type, voice_memo_url, text_input, ai_draft, verified_claims, status)
- verified_claims (id, section_id, claim_text, verified, corrected_value)
- center_data (id, center_id, key, value, source, last_verified)

## Phase 3: Application Builder (Core Product)
The v7 UX flow:
1. Grant detail page → "Start Application" → creates application record
2. Section overview showing all 5-8 sections with progress
3. Each narrative section card shows:
   - One open-ended prompt with 3 sub-prompts
   - Voice memo recorder (MediaRecorder API) or text input
   - After input: sufficiency check (AI evaluates if input has enough specifics)
   - If thin: 1-2 follow-up questions
   - Full professional rewrite via Claude API
   - Claim-level verification: list of extractable facts with ✓/Fix buttons
4. Data sections: auto-filled from center profile, review-and-confirm
5. Budget section: scaffolded line items with examples, crossfoot validation
6. Auto-save throughout

## Phase 4: Review + Export
- Cross-section strategic contradiction check (Claude API)
- Section-by-section approval
- Generate downloadable PDF/Word document
- Portal-specific submission instructions

## Phase 5: Stripe Payments
- $199/month subscription
- 14-day free trial
- Stripe Checkout integration
- Webhook for subscription status
- Gate application builder behind active subscription

## Phase 6: Returning User Flow
- Replay prior voice memos
- Show what THIS grant emphasizes vs. last application
- Options: use previous input / record new / update
- Re-run assembly against new grant's rubric
