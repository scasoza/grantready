-- Add fields from quiz to centers table
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS county text;
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS licensed_capacity integer;
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS ccs_count integer;
