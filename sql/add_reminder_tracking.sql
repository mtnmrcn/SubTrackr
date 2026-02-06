-- Add last_reminder_sent field for tracking sent reminders
-- Run this in your Supabase SQL Editor

-- Add last_reminder_sent column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS last_reminder_sent DATE;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.last_reminder_sent IS 'Date when the last payment reminder was sent for the current payment cycle';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_reminder_lookup
ON subscriptions (is_active, next_payment_date, last_reminder_sent)
WHERE is_active = true;

-- Optional: Add trigger to reset last_reminder_sent when next_payment_date changes
CREATE OR REPLACE FUNCTION reset_reminder_on_payment_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If next_payment_date changes, reset last_reminder_sent
  IF NEW.next_payment_date != OLD.next_payment_date THEN
    NEW.last_reminder_sent := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_reset_reminder ON subscriptions;

CREATE TRIGGER trigger_reset_reminder
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (OLD.next_payment_date IS DISTINCT FROM NEW.next_payment_date)
  EXECUTE FUNCTION reset_reminder_on_payment_update();

-- Add helpful comment
COMMENT ON TRIGGER trigger_reset_reminder ON subscriptions IS
'Automatically resets last_reminder_sent when next_payment_date changes to ensure reminders are sent for the new payment date';
