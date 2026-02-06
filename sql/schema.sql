-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Other',
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    next_payment_date DATE NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    reminder_days INTEGER NOT NULL DEFAULT 3 CHECK (reminder_days >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Create index on next_payment_date for upcoming payments queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON subscriptions(next_payment_date);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);

-- Create composite index for active subscriptions by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON subscriptions(user_id, is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON subscriptions;

-- Create RLS policies
-- Users can only view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
    ON subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
    ON subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions"
    ON subscriptions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON subscriptions TO postgres, anon, authenticated, service_role;

-- Optional: Create a view for upcoming payments
CREATE OR REPLACE VIEW upcoming_payments AS
SELECT
    id,
    user_id,
    name,
    category,
    price,
    currency,
    billing_cycle,
    next_payment_date,
    color,
    (next_payment_date - CURRENT_DATE) as days_until_payment
FROM subscriptions
WHERE
    is_active = true
    AND next_payment_date >= CURRENT_DATE
    AND next_payment_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY next_payment_date ASC;

-- Grant permissions on view
GRANT SELECT ON upcoming_payments TO postgres, anon, authenticated, service_role;

-- Comment on table and columns for documentation
COMMENT ON TABLE subscriptions IS 'Stores user subscription information';
COMMENT ON COLUMN subscriptions.id IS 'Unique subscription identifier';
COMMENT ON COLUMN subscriptions.user_id IS 'Reference to the user who owns this subscription';
COMMENT ON COLUMN subscriptions.name IS 'Name of the subscription service';
COMMENT ON COLUMN subscriptions.category IS 'Category of the subscription (AI, Entertainment, etc.)';
COMMENT ON COLUMN subscriptions.price IS 'Price of the subscription';
COMMENT ON COLUMN subscriptions.currency IS 'Currency code (EUR, USD, etc.)';
COMMENT ON COLUMN subscriptions.billing_cycle IS 'Billing frequency (monthly or yearly)';
COMMENT ON COLUMN subscriptions.next_payment_date IS 'Date of the next payment';
COMMENT ON COLUMN subscriptions.color IS 'Hex color code for UI display';
COMMENT ON COLUMN subscriptions.reminder_days IS 'Days before payment to send reminder';
COMMENT ON COLUMN subscriptions.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN subscriptions.created_at IS 'Timestamp when subscription was created';
COMMENT ON COLUMN subscriptions.updated_at IS 'Timestamp when subscription was last updated';
