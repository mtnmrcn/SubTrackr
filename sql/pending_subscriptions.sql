-- =====================================================
-- SubTrackr: Pending Subscriptions Schema
-- Für Rechnungs-Scanner Feature
-- =====================================================

-- Tabelle für ausstehende/erkannte Rechnungen
CREATE TABLE IF NOT EXISTS pending_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Original-Datei Infos
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')),
    google_drive_url TEXT,
    google_drive_file_id VARCHAR(100),

    -- Extrahierte Rohdaten
    raw_ocr_text TEXT,

    -- Strukturierte/geparste Daten (von GPT)
    parsed_name VARCHAR(255),
    parsed_price DECIMAL(10, 2) CHECK (parsed_price IS NULL OR parsed_price >= 0),
    parsed_currency VARCHAR(3) DEFAULT 'EUR',
    parsed_billing_cycle VARCHAR(20) CHECK (parsed_billing_cycle IS NULL OR parsed_billing_cycle IN ('monthly', 'quarterly', 'yearly', 'one_time')),
    parsed_next_payment DATE,
    parsed_category VARCHAR(100),
    parsed_payment_method VARCHAR(50),

    -- Confidence & Status
    confidence_score DECIMAL(3, 2) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
    status VARCHAR(20) NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'pending', 'confirmed', 'rejected', 'error')),

    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ
);

-- Indizes für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_pending_user_id ON pending_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pending_user_status ON pending_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_created_at ON pending_subscriptions(created_at DESC);

-- Trigger für updated_at (falls gewünscht)
-- Nutzt die bereits existierende Funktion aus schema.sql

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE pending_subscriptions ENABLE ROW LEVEL SECURITY;

-- Bestehende Policies löschen falls vorhanden
DROP POLICY IF EXISTS "Users can view their own pending subscriptions" ON pending_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own pending subscriptions" ON pending_subscriptions;
DROP POLICY IF EXISTS "Users can update their own pending subscriptions" ON pending_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own pending subscriptions" ON pending_subscriptions;

-- User Policies
CREATE POLICY "Users can view their own pending subscriptions"
    ON pending_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending subscriptions"
    ON pending_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending subscriptions"
    ON pending_subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending subscriptions"
    ON pending_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- Berechtigungen
GRANT ALL ON pending_subscriptions TO postgres, anon, authenticated, service_role;

-- =====================================================
-- Storage Bucket für Rechnungen
-- =====================================================

-- Bucket erstellen (muss im Supabase Dashboard oder via API gemacht werden)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'receipts',
--     'receipts',
--     false,
--     10485760, -- 10MB max
--     ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
-- );

-- Storage Policies (müssen nach Bucket-Erstellung ausgeführt werden)
-- Wichtig: Bucket muss erst existieren!

-- DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;

-- CREATE POLICY "Users can upload their own receipts"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--         bucket_id = 'receipts'
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can view their own receipts"
--     ON storage.objects FOR SELECT
--     USING (
--         bucket_id = 'receipts'
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can delete their own receipts"
--     ON storage.objects FOR DELETE
--     USING (
--         bucket_id = 'receipts'
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- =====================================================
-- Dokumentation
-- =====================================================

COMMENT ON TABLE pending_subscriptions IS 'Speichert erkannte Rechnungen bis zur Bestätigung durch den User';
COMMENT ON COLUMN pending_subscriptions.id IS 'Eindeutige ID der ausstehenden Erkennung';
COMMENT ON COLUMN pending_subscriptions.user_id IS 'Referenz zum User';
COMMENT ON COLUMN pending_subscriptions.original_filename IS 'Originaler Dateiname der hochgeladenen Datei';
COMMENT ON COLUMN pending_subscriptions.file_type IS 'Dateityp: pdf, jpg, jpeg, png, webp';
COMMENT ON COLUMN pending_subscriptions.google_drive_url IS 'URL zur Backup-Datei in Google Drive';
COMMENT ON COLUMN pending_subscriptions.google_drive_file_id IS 'Google Drive File ID für direkten Zugriff';
COMMENT ON COLUMN pending_subscriptions.raw_ocr_text IS 'Roher Text aus der OCR-Erkennung';
COMMENT ON COLUMN pending_subscriptions.parsed_name IS 'Erkannter Anbietername';
COMMENT ON COLUMN pending_subscriptions.parsed_price IS 'Erkannter Preis';
COMMENT ON COLUMN pending_subscriptions.parsed_currency IS 'Erkannte Währung (EUR, USD, etc.)';
COMMENT ON COLUMN pending_subscriptions.parsed_billing_cycle IS 'Erkannter Abrechnungszyklus';
COMMENT ON COLUMN pending_subscriptions.parsed_next_payment IS 'Erkanntes Zahlungsdatum';
COMMENT ON COLUMN pending_subscriptions.parsed_category IS 'Erkannte Kategorie';
COMMENT ON COLUMN pending_subscriptions.confidence_score IS 'Konfidenz der Erkennung (0.0-1.0)';
COMMENT ON COLUMN pending_subscriptions.status IS 'Status: uploading, processing, pending, confirmed, rejected, error';
COMMENT ON COLUMN pending_subscriptions.error_message IS 'Fehlermeldung bei Status=error';
