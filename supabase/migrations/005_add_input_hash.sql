-- Add input_hash column to application_sections
-- Used for stale document detection (compare hash of center data at generation time vs current)
ALTER TABLE application_sections
ADD COLUMN IF NOT EXISTS input_hash TEXT;
