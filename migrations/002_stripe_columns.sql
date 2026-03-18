-- Run this against Supabase to add Stripe columns to centers table
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none';
