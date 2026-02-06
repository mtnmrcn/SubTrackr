-- Add payment_method field and update billing_cycle constraint
-- Run this in your Supabase SQL Editor

-- Add payment_method column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'other'
CHECK (payment_method IN ('paypal', 'credit_card', 'bank_transfer', 'sepa', 'other'));

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.payment_method IS 'Payment method used for the subscription';

-- Update billing_cycle constraint to include quarterly
-- First, drop the existing constraint
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;

-- Add new constraint with quarterly option
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_billing_cycle_check
CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly'));

-- Add comment
COMMENT ON COLUMN subscriptions.billing_cycle IS 'Billing cycle: monthly, quarterly (every 3 months), or yearly';
