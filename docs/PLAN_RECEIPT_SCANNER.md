# Implementierungsplan: Rechnungs-Scanner für SubTrackr

## Übersicht

Automatische Erkennung und Erfassung von Rechnungen/Zahlungsbelegen durch Upload von PDFs oder Fotos. Die Daten werden per OCR extrahiert, strukturiert und als Subscription-Entwurf zur Bestätigung bereitgestellt.

---

## Architektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUBTRACKR APP                               │
│                                                                     │
│  [Upload-Bereich]                                                   │
│       │  - Drag & Drop Zone                                         │
│       │  - Datei-Auswahl (PDF, JPG, PNG)                           │
│       │  - Mehrere Dateien gleichzeitig                            │
│       ↓                                                             │
│  [Supabase Storage] ──────────────────────┐                        │
│       │  Bucket: "receipts"               │                        │
│       │  RLS: Nur eigene Dateien          │                        │
│       ↓                                   ↓                        │
│  [Webhook → n8n]                   [Google Drive]                  │
│                                    Ordner: SubTrackr/Rechnungen/   │
│                                    Struktur: /Jahr/Monat/          │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         N8N WORKFLOW                                │
│                                                                     │
│  1. [Webhook Trigger]                                               │
│       │  Empfängt: file_path, user_id, filename                    │
│       ↓                                                             │
│  2. [Supabase Storage Download]                                     │
│       │  Lädt Datei temporär herunter                              │
│       ↓                                                             │
│  3. [PDF zu Bildern konvertieren] (falls PDF)                      │
│       │  Alle Seiten als separate Bilder                           │
│       ↓                                                             │
│  4. [Google Cloud Vision API]                                       │
│       │  OCR für jede Seite/jedes Bild                             │
│       │  Kosten: ~0.0015€ pro Bild                                 │
│       ↓                                                             │
│  5. [GPT-3.5-turbo Analyse]                                        │
│       │  Strukturiert den extrahierten Text                        │
│       │  Extrahiert: Name, Preis, Währung, Datum, Kategorie        │
│       │  Kosten: ~0.001€ pro Request                               │
│       ↓                                                             │
│  6. [Google Drive Upload]                                           │
│       │  Backup der Original-Datei                                 │
│       │  Ordnerstruktur: /SubTrackr/Rechnungen/2024/02/            │
│       ↓                                                             │
│  7. [Supabase Insert: pending_subscriptions]                       │
│       │  Speichert extrahierte Daten als Entwurf                   │
│       ↓                                                             │
│  8. [Supabase Storage Cleanup]                                      │
│       │  Löscht temporäre Datei aus Storage                        │
│       ↓                                                             │
│  9. [Webhook Response]                                              │
│       └→ Erfolg/Fehler Status                                      │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    BESTÄTIGUNGS-FLOW                                │
│                                                                     │
│  [App zeigt "Ausstehende Erkennungen"]                             │
│       │                                                             │
│       │  ┌──────────────────────────────────────┐                  │
│       │  │  Netflix - 12,99 EUR                 │                  │
│       │  │  Monatlich | Entertainment           │                  │
│       │  │  Nächste Zahlung: 15.02.2024         │                  │
│       │  │                                      │                  │
│       │  │  [Bearbeiten] [Bestätigen] [Ablehnen]│                  │
│       │  └──────────────────────────────────────┘                  │
│       ↓                                                             │
│  [User bestätigt] → Subscription wird erstellt                     │
│  [User lehnt ab]  → Entwurf wird gelöscht                          │
│  [User bearbeitet] → Modal mit vorausgefüllten Daten               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Datenbank-Erweiterungen

### 1.1 Neue Tabelle: `pending_subscriptions`

```sql
-- Tabelle für ausstehende/erkannte Rechnungen
CREATE TABLE IF NOT EXISTS pending_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Original-Datei Infos
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL, -- 'pdf', 'jpg', 'png'
    google_drive_url TEXT,
    google_drive_file_id VARCHAR(100),

    -- Extrahierte Rohdaten
    raw_ocr_text TEXT,

    -- Strukturierte/geparste Daten (von GPT)
    parsed_name VARCHAR(255),
    parsed_price DECIMAL(10, 2),
    parsed_currency VARCHAR(3) DEFAULT 'EUR',
    parsed_billing_cycle VARCHAR(20),
    parsed_next_payment DATE,
    parsed_category VARCHAR(100),

    -- Confidence & Status
    confidence_score DECIMAL(3, 2), -- 0.00 - 1.00
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Mögliche Status: 'pending', 'confirmed', 'rejected', 'processing', 'error'

    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ
);

-- Indizes
CREATE INDEX idx_pending_user_id ON pending_subscriptions(user_id);
CREATE INDEX idx_pending_status ON pending_subscriptions(status);
CREATE INDEX idx_pending_user_status ON pending_subscriptions(user_id, status);

-- RLS aktivieren
ALTER TABLE pending_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pending subscriptions"
    ON pending_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending subscriptions"
    ON pending_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending subscriptions"
    ON pending_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending subscriptions"
    ON pending_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- Service Role Policy (für n8n Webhook)
CREATE POLICY "Service role can manage all pending subscriptions"
    ON pending_subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
```

### 1.2 Supabase Storage Bucket

```sql
-- Storage Bucket für temporäre Uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts',
    false,
    10485760, -- 10MB max
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Storage RLS Policies
CREATE POLICY "Users can upload their own receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own receipts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own receipts"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'receipts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Service Role kann alles (für n8n)
CREATE POLICY "Service role full access to receipts"
    ON storage.objects
    FOR ALL
    TO service_role
    USING (bucket_id = 'receipts')
    WITH CHECK (bucket_id = 'receipts');
```

---

## Phase 2: n8n Workflow

### 2.1 Workflow-Struktur

**Workflow Name:** `SubTrackr - Receipt Scanner`

**Nodes:**

1. **Webhook Trigger**
   - Method: POST
   - Path: `/subtrackr/receipt`
   - Authentication: Header Auth (API Key)
   - Body Parameters:
     ```json
     {
       "file_path": "user-id/filename.pdf",
       "user_id": "uuid",
       "filename": "rechnung.pdf",
       "file_type": "pdf",
       "pending_id": "uuid"
     }
     ```

2. **Supabase - Download File**
   - Operation: Download from Storage
   - Bucket: receipts
   - File Path: `{{ $json.file_path }}`

3. **IF - Check File Type**
   - Condition: `{{ $json.file_type === 'pdf' }}`
   - True → PDF Conversion Node
   - False → Directly to Vision API

4. **PDF to Images** (für PDFs)
   - Tool: pdf-poppler oder ImageMagick
   - Konvertiert alle Seiten zu PNG
   - Output: Array von Base64-Bildern

5. **Google Cloud Vision - OCR**
   - API: `vision.googleapis.com/v1/images:annotate`
   - Feature: `TEXT_DETECTION` oder `DOCUMENT_TEXT_DETECTION`
   - Für jede Seite/jedes Bild
   - Kombiniert alle Texte

6. **OpenAI GPT-3.5-turbo - Strukturierung**
   - Model: `gpt-3.5-turbo`
   - System Prompt:
     ```
     Du bist ein Experte für das Analysieren von Rechnungen und Zahlungsbelegen.
     Extrahiere folgende Informationen aus dem Text und gib sie als JSON zurück:

     {
       "name": "Name des Dienstleisters/Anbieters",
       "price": 12.99,
       "currency": "EUR",
       "billing_cycle": "monthly|quarterly|yearly|one_time",
       "next_payment_date": "2024-02-15",
       "category": "Entertainment|AI|Hosting|Development|Design|Productivity|Cloud Storage|Security|Other",
       "confidence": 0.95
     }

     Regeln:
     - Wenn Informationen nicht gefunden werden, setze null
     - Preise immer als Dezimalzahl
     - Datum im Format YYYY-MM-DD
     - Confidence ist deine Einschätzung wie sicher du dir bist (0.0-1.0)
     - Bei wiederkehrenden Abos: next_payment_date = nächstes Fälligkeitsdatum
     - Bei einmaligen: next_payment_date = Rechnungsdatum
     ```
   - User Prompt: `{{ $json.ocr_text }}`

7. **Google Drive - Upload Backup**
   - Folder: `SubTrackr/Rechnungen/{{ $now.format('yyyy') }}/{{ $now.format('MM') }}`
   - Filename: `{{ $json.filename }}`
   - Create folder if not exists: true

8. **Supabase - Update Pending Subscription**
   - Table: pending_subscriptions
   - Operation: Update
   - Filter: id = `{{ $json.pending_id }}`
   - Data:
     ```json
     {
       "raw_ocr_text": "{{ $json.ocr_text }}",
       "parsed_name": "{{ $json.gpt_response.name }}",
       "parsed_price": "{{ $json.gpt_response.price }}",
       "parsed_currency": "{{ $json.gpt_response.currency }}",
       "parsed_billing_cycle": "{{ $json.gpt_response.billing_cycle }}",
       "parsed_next_payment": "{{ $json.gpt_response.next_payment_date }}",
       "parsed_category": "{{ $json.gpt_response.category }}",
       "confidence_score": "{{ $json.gpt_response.confidence }}",
       "google_drive_url": "{{ $json.drive_url }}",
       "google_drive_file_id": "{{ $json.drive_file_id }}",
       "status": "pending",
       "processed_at": "{{ $now.toISO() }}"
     }
     ```

9. **Supabase - Delete Temp File**
   - Operation: Delete from Storage
   - Bucket: receipts
   - File Path: `{{ $json.file_path }}`

10. **Error Handler**
    - Bei Fehler: Update pending_subscriptions mit status='error' und error_message

### 2.2 Webhook-Authentifizierung

```
Header: X-API-Key: [your-secure-api-key]
```

Diese API-Key wird in SubTrackr als Umgebungsvariable gespeichert:
```
VITE_N8N_WEBHOOK_URL=https://your-n8n-server.com/webhook/subtrackr/receipt
VITE_N8N_API_KEY=your-secure-api-key
```

---

## Phase 3: Frontend-Komponenten

### 3.1 Neue Dateien

```
src/
├── components/
│   ├── ReceiptUpload.jsx          # Upload-Zone Komponente
│   ├── PendingSubscriptionCard.jsx # Karte für ausstehende Erkennungen
│   └── ConfirmSubscriptionModal.jsx # Bestätigungs-Modal
├── services/
│   └── receiptService.js          # API-Calls für Receipt-Funktionen
└── hooks/
    └── usePendingSubscriptions.js # Hook für Pending-Daten
```

### 3.2 ReceiptUpload.jsx

**Funktionen:**
- Drag & Drop Zone
- Datei-Auswahl Button
- Unterstützte Formate: PDF, JPG, PNG, WEBP
- Max. Dateigröße: 10MB
- Multi-Upload (mehrere Dateien gleichzeitig)
- Upload-Fortschritt Anzeige
- Status: Uploading → Processing → Done/Error

**UI-Elemente:**
```jsx
<div className="receipt-upload-zone">
  <Upload className="icon" />
  <p>Rechnung hier ablegen oder klicken zum Auswählen</p>
  <p className="hint">PDF, JPG, PNG - max. 10MB</p>
</div>
```

### 3.3 PendingSubscriptionCard.jsx

**Anzeige:**
- Erkannter Name
- Erkannter Preis + Währung
- Erkannter Zyklus
- Confidence-Score (als Balken/Prozent)
- Google Drive Link (zum Original)
- Aktionen: Bestätigen, Bearbeiten, Ablehnen

### 3.4 ConfirmSubscriptionModal.jsx

**Basiert auf SubscriptionModal.jsx, aber:**
- Felder sind vorausgefüllt mit erkannten Daten
- Felder mit niedriger Confidence sind markiert (gelb)
- User kann alle Werte korrigieren
- Bei Bestätigung: pending_subscription wird gelöscht, echte subscription erstellt

### 3.5 Dashboard-Integration

**Neuer Abschnitt im Dashboard:**
```jsx
{/* Receipt Upload Section */}
<div className="glass-card">
  <h3>Rechnung scannen</h3>
  <ReceiptUpload onUploadComplete={handleUploadComplete} />
</div>

{/* Pending Subscriptions */}
{pendingSubscriptions.length > 0 && (
  <div className="glass-card">
    <h3>Ausstehende Erkennungen ({pendingSubscriptions.length})</h3>
    {pendingSubscriptions.map(pending => (
      <PendingSubscriptionCard
        key={pending.id}
        data={pending}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
        onReject={handleReject}
      />
    ))}
  </div>
)}
```

---

## Phase 4: Services & Hooks

### 4.1 receiptService.js

```javascript
// Upload Rechnung zu Supabase Storage
export const uploadReceipt = async (file) => { ... }

// Trigger n8n Webhook
export const triggerReceiptProcessing = async (filePath, userId, filename, fileType, pendingId) => { ... }

// Pending Subscriptions CRUD
export const getPendingSubscriptions = async () => { ... }
export const confirmPendingSubscription = async (pendingId, subscriptionData) => { ... }
export const rejectPendingSubscription = async (pendingId) => { ... }
```

### 4.2 usePendingSubscriptions.js

```javascript
export const usePendingSubscriptions = () => {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  // Real-time subscription für Updates
  useEffect(() => {
    const subscription = supabase
      .channel('pending_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pending_subscriptions'
      }, handleChange)
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  return { pending, loading, confirmPending, rejectPending }
}
```

---

## Phase 5: Implementierungsreihenfolge

### Schritt 1: Datenbank (Supabase)
1. SQL für `pending_subscriptions` Tabelle ausführen
2. Storage Bucket "receipts" erstellen
3. RLS Policies konfigurieren
4. Testen mit Supabase Dashboard

### Schritt 2: n8n Workflow
1. Neuen Workflow erstellen
2. Webhook Node konfigurieren
3. Google Cloud Vision Node einrichten
4. OpenAI Node einrichten
5. Google Drive Node einrichten
6. Supabase Nodes einrichten
7. Error Handling hinzufügen
8. Testen mit Postman/cURL

### Schritt 3: Frontend Services
1. `receiptService.js` erstellen
2. `usePendingSubscriptions.js` Hook erstellen
3. Umgebungsvariablen hinzufügen

### Schritt 4: Frontend Komponenten
1. `ReceiptUpload.jsx` erstellen
2. `PendingSubscriptionCard.jsx` erstellen
3. `ConfirmSubscriptionModal.jsx` erstellen
4. Dashboard.jsx erweitern

### Schritt 5: Integration & Testing
1. End-to-End Test: Upload → Processing → Bestätigung
2. Fehlerbehandlung testen
3. Edge Cases: Leere PDFs, unleserliche Bilder, etc.

---

## Kosten-Kalkulation (Pro Rechnung)

| Service | Kosten |
|---------|--------|
| Google Cloud Vision | ~0.0015€ |
| GPT-3.5-turbo | ~0.001€ |
| Supabase Storage | Kostenlos (1GB Free) |
| Google Drive | Kostenlos (15GB Free) |
| **Gesamt** | **~0.0025€** |

**Bei 100 Rechnungen/Monat:** ~0.25€
**Bei 1000 Rechnungen/Monat:** ~2.50€

---

## Sicherheitsüberlegungen

1. **API Key Schutz**: n8n Webhook nur mit API Key erreichbar
2. **RLS**: User können nur eigene Daten sehen/bearbeiten
3. **Datei-Validierung**: MIME-Type Check, Größenlimit
4. **Temporäre Speicherung**: Dateien werden nach Verarbeitung gelöscht
5. **Google Drive Backup**: Langzeit-Archivierung außerhalb der App

---

## Optionale Erweiterungen (Zukunft)

1. **E-Mail Integration**: Rechnungen direkt aus E-Mail-Anhängen importieren
2. **Automatische Kategorisierung**: ML-basierte Kategorie-Erkennung
3. **Duplikat-Erkennung**: Warnung bei ähnlichen Rechnungen
4. **OCR-Feedback**: User kann OCR-Fehler melden zur Verbesserung
5. **Batch-Import**: Mehrere Rechnungen auf einmal verarbeiten
6. **Mobile Kamera**: Direktes Fotografieren in der App (PWA)

---

## Offene Fragen (geklärt)

- [x] Google Drive Ordnerstruktur: `SubTrackr/Rechnungen/Jahr/Monat/`
- [x] Bestätigungsflow: Manuelle Bestätigung für jede Rechnung
- [x] PDF-Support: Mehrseitige PDFs werden unterstützt
- [x] OCR-Service: Google Cloud Vision (günstiger)
