-- Add website and notes fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS website VARCHAR(500),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN subscriptions.website IS 'Optional website URL of the subscription service';
COMMENT ON COLUMN subscriptions.notes IS 'Personal notes about the subscription';
