# Receipt Scanner - Setup Anleitung

Diese Anleitung beschreibt die Einrichtung des automatischen Rechnungs-Scanners für SubTrackr.

## Übersicht

Der Receipt Scanner ermöglicht das automatische Erkennen und Erfassen von Rechnungen durch:
1. Upload von PDF/Bild in der App
2. OCR-Verarbeitung via Google Cloud Vision
3. Strukturierung via GPT-3.5
4. Backup in Google Drive
5. Bestätigung durch den User

## Voraussetzungen

- Supabase Projekt (bereits eingerichtet)
- n8n Server (self-hosted bei Hostinger)
- Google Cloud Account (für Vision API)
- OpenAI API Key (für GPT-3.5)
- Google Drive API Zugang

---

## Schritt 1: Supabase Einrichtung

### 1.1 Tabelle erstellen

Führe das SQL-Script aus `sql/pending_subscriptions.sql` in der Supabase SQL-Console aus:

1. Öffne dein Supabase Dashboard
2. Gehe zu "SQL Editor"
3. Füge den Inhalt von `sql/pending_subscriptions.sql` ein
4. Klicke auf "Run"

### 1.2 Storage Bucket erstellen

1. Gehe zu "Storage" im Supabase Dashboard
2. Klicke auf "New bucket"
3. Name: `receipts`
4. Public: **Nein** (wichtig für Sicherheit!)
5. Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`
6. Max file size: `10MB`

### 1.3 Storage Policies erstellen

Führe diese SQL-Befehle aus:

```sql
-- Users können eigene Dateien hochladen
CREATE POLICY "Users can upload their own receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users können eigene Dateien sehen
CREATE POLICY "Users can view their own receipts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users können eigene Dateien löschen
CREATE POLICY "Users can delete their own receipts"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'receipts'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

---

## Schritt 2: Google Cloud Vision API

### 2.1 API aktivieren

1. Gehe zur [Google Cloud Console](https://console.cloud.google.com)
2. Wähle dein Projekt oder erstelle ein neues
3. Suche nach "Cloud Vision API"
4. Klicke auf "Aktivieren"

### 2.2 Service Account erstellen

1. Gehe zu "IAM & Admin" → "Service Accounts"
2. Klicke auf "Create Service Account"
3. Name: `subtrackr-vision`
4. Rolle: "Cloud Vision API User"
5. Klicke auf "Create Key" → JSON
6. Speichere die JSON-Datei sicher

---

## Schritt 3: Google Drive API

### 3.1 API aktivieren

1. In der Google Cloud Console
2. Suche nach "Google Drive API"
3. Klicke auf "Aktivieren"

### 3.2 OAuth oder Service Account

**Option A: Service Account (empfohlen für Server)**
- Verwende denselben Service Account wie für Vision
- Füge die Rolle "Google Drive API" hinzu
- Teile den Zielordner mit der Service Account E-Mail

**Option B: OAuth (für persönliche Drive)**
- Erstelle OAuth 2.0 Credentials in der Cloud Console
- Konfiguriere den Redirect URI für n8n

### 3.3 Ordnerstruktur erstellen

Erstelle in Google Drive:
```
SubTrackr/
└── Rechnungen/
    └── 2024/
        └── 01/
        └── 02/
        └── ...
```

---

## Schritt 4: n8n Workflow

### 4.1 Workflow importieren oder erstellen

Erstelle einen neuen Workflow in n8n mit folgenden Nodes:

#### Node 1: Webhook Trigger
- HTTP Method: POST
- Path: `/subtrackr/receipt`
- Authentication: Header Auth
- Header Name: `X-API-Key`
- Header Value: Dein sicheres API-Key

#### Node 2: HTTP Request (Supabase Download)
- Method: GET
- URL: `{{ $env.SUPABASE_URL }}/storage/v1/object/receipts/{{ $json.file_path }}`
- Headers:
  - `Authorization`: `Bearer {{ $env.SUPABASE_SERVICE_KEY }}`
  - `apikey`: `{{ $env.SUPABASE_SERVICE_KEY }}`

#### Node 3: Google Cloud Vision
- Credentials: Google Cloud Vision API
- Operation: Text Detection (oder Document Text Detection für bessere PDF-Erkennung)
- Input: Binary Data vom vorherigen Node

#### Node 4: OpenAI (GPT-3.5)
- Model: gpt-3.5-turbo
- System Message:
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
```
- User Message: `{{ $json.ocr_text }}`

#### Node 5: Google Drive Upload
- Credentials: Google Drive OAuth oder Service Account
- Operation: Upload
- Folder: `SubTrackr/Rechnungen/{{ $now.format('yyyy') }}/{{ $now.format('MM') }}`
- Filename: `{{ $json.filename }}`

#### Node 6: Supabase (Update pending_subscriptions)
- Operation: Update
- Table: pending_subscriptions
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

#### Node 7: Supabase (Delete temp file)
- Operation: Delete from Storage
- Bucket: receipts
- Path: `{{ $json.file_path }}`

#### Error Handler Node
- Bei Fehler: Update status auf 'error' und error_message setzen

### 4.2 Environment Variables in n8n

Setze folgende Umgebungsvariablen in n8n:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...  (Service Role Key, NICHT anon key!)
```

---

## Schritt 5: Frontend Konfiguration

### 5.1 Umgebungsvariablen

Füge zu deiner `.env` Datei hinzu:

```env
VITE_N8N_WEBHOOK_URL=https://your-n8n-server.com/webhook/subtrackr/receipt
VITE_N8N_API_KEY=your-secure-api-key
```

### 5.2 API Key generieren

Generiere ein sicheres API-Key:

```bash
openssl rand -hex 32
```

Oder verwende einen Passwort-Generator.

---

## Schritt 6: Testen

### 6.1 Upload testen

1. Starte die App (`npm run dev`)
2. Gehe zu "Scanner" im Menü
3. Lade eine Test-Rechnung hoch
4. Beobachte den Status: Uploading → Processing → Pending

### 6.2 Debugging

**Webhook erreicht n8n nicht:**
- Prüfe die Webhook URL
- Prüfe Firewall/CORS Einstellungen
- Prüfe n8n Logs

**OCR funktioniert nicht:**
- Prüfe Google Cloud Vision API Quota
- Prüfe Service Account Berechtigungen

**GPT antwortet nicht korrekt:**
- Prüfe das Prompt Format
- Prüfe die JSON-Struktur

**Google Drive Upload fehlgeschlagen:**
- Prüfe OAuth Token / Service Account
- Prüfe Ordner-Berechtigungen

---

## Kosten-Übersicht

| Service | Kosten pro Rechnung |
|---------|---------------------|
| Google Cloud Vision | ~0.0015€ |
| OpenAI GPT-3.5 | ~0.001€ |
| Supabase Storage | Kostenlos (1GB) |
| Google Drive | Kostenlos (15GB) |
| **Gesamt** | **~0.0025€** |

Bei 100 Rechnungen/Monat: ~0.25€

---

## Sicherheitshinweise

1. **API Keys** niemals im Frontend-Code oder Git committen
2. **Service Role Key** nur im Backend (n8n) verwenden
3. **Webhook** immer mit API-Key schützen
4. **RLS Policies** auf Supabase aktiviert lassen
5. **HTTPS** überall verwenden
6. **Temporäre Dateien** nach Verarbeitung löschen

---

## Troubleshooting

### Problem: "Upload fehlgeschlagen"
- Prüfe Dateigröße (max 10MB)
- Prüfe Dateityp (PDF, JPG, PNG, WEBP)
- Prüfe Supabase Storage Bucket existiert

### Problem: "Verarbeitung hängt"
- Prüfe n8n Workflow ist aktiv
- Prüfe Webhook URL korrekt
- Prüfe API Keys gültig

### Problem: "Niedrige Erkennungs-Sicherheit"
- Bessere Bildqualität verwenden
- Rechnung gerade fotografieren
- PDF statt Foto verwenden wenn möglich
