-- Add input_hash to application_sections for staleness detection
ALTER TABLE application_sections ADD COLUMN IF NOT EXISTS input_hash text;

-- Add generation metering to centers
ALTER TABLE centers ADD COLUMN IF NOT EXISTS ai_generations_this_month integer DEFAULT 0;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS generation_month integer DEFAULT 0;

-- Submissions table for concierge workflow
CREATE TABLE IF NOT EXISTS submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id uuid REFERENCES centers(id) NOT NULL,
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
