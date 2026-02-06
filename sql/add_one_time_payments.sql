-- Add one-time payment support to billing_cycle
-- Run this in your Supabase SQL Editor

-- Update billing_cycle constraint to include 'one_time'
-- First, drop the existing constraint
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;

-- Add new constraint with one_time option
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_billing_cycle_check
CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'one_time'));

-- Update comment
COMMENT ON COLUMN subscriptions.billing_cycle IS 'Billing cycle: monthly, quarterly (every 3 months), yearly, or one_time (single payment)';

-- Make next_payment_date nullable for one-time payments (they use it as payment date)
-- This is already nullable in most cases, but let's ensure it
ALTER TABLE subscriptions
ALTER COLUMN next_payment_date DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN subscriptions.next_payment_date IS 'For recurring: next payment date. For one_time: the date when payment was made';

-- Optional: Set reminder_days to 0 for one-time payments
-- This can be done via trigger or application logic
CREATE OR REPLACE FUNCTION set_one_time_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- For one-time payments, set reminder_days to 0 (no reminders needed)
  IF NEW.billing_cycle = 'one_time' THEN
    NEW.reminder_days := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_one_time_defaults ON subscriptions;

CREATE TRIGGER trigger_one_time_defaults
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (NEW.billing_cycle = 'one_time')
  EXECUTE FUNCTION set_one_time_defaults();

-- Add helpful comment
COMMENT ON TRIGGER trigger_one_time_defaults ON subscriptions IS
'Automatically sets reminder_days to 0 for one-time payments since they do not need reminders';
