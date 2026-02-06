# SubTrackr

## Projektbeschreibung
SubTrackr ist eine SaaS-Anwendung zur Verwaltung von Abonnements. Die App ermöglicht es Nutzern, ihre verschiedenen Abonnements zu tracken, Kosten zu überwachen und Kündigungsfristen im Blick zu behalten.

## Tech-Stack

### Frontend
- **React 18** - UI-Framework
- **Vite** - Build-Tool und Dev-Server
- **Tailwind CSS** - Utility-First CSS Framework
- **Lucide Icons** - Icon-Bibliothek

### Backend & Datenbank
- **Supabase** - Backend-as-a-Service (Authentication, Database, Storage)

## Entwicklungsrichtlinien

### Sprache
- **UI/UX**: Deutsch (alle Benutzeroberflächen-Texte, Fehlermeldungen, etc.)
- **Code**: Englisch (Variablennamen, Funktionsnamen, Kommentare, etc.)

### Code-Standards
- Funktionale React-Komponenten mit Hooks
- Tailwind CSS für Styling (keine inline styles)
- Klare Komponentenstruktur und Separation of Concerns
- TypeScript-ready (optional für zukünftige Migration)

## Projektstruktur
```
SubTrackr/
├── src/
│   ├── components/     # React-Komponenten
│   ├── lib/           # Utilities, Helper-Funktionen
│   ├── hooks/         # Custom React Hooks
│   ├── services/      # API-Services (Supabase)
│   ├── App.jsx        # Haupt-App-Komponente
│   └── main.jsx       # Entry Point
├── public/            # Statische Assets
└── package.json       # Dependencies
```

## Setup-Anleitung

### Installation
```bash
npm install
```

### Entwicklung
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Features
- ✅ Abo-Übersicht mit Kostenkalkulation
- ✅ Erinnerungen für Kündigungsfristen
- ✅ Kategorisierung von Abonnements
- ✅ Dashboard mit Statistiken
- ✅ Benutzer-Authentifizierung
- ✅ Real-time Updates
- 🔄 Export-Funktionen (geplant)

## Sicherheit

### Implementierte Security-Features

#### Input Validation & Sanitization
- Alle User-Eingaben werden validiert und sanitiert (siehe `src/lib/validation.js`)
- XSS-Schutz durch Entfernung von HTML-Tags
- SQL-Injection-Schutz durch Supabase Prepared Statements
- Email-Format-Validierung
- Passwort-Stärke-Validierung (min. 6, max. 72 Zeichen)
- Preis-Validierung (nur positive Werte, max. 2 Dezimalstellen)
- Datum-Validierung (sinnvolle Zeiträume)

#### Authentication & Authorization
- Supabase Authentication mit E-Mail/Passwort
- Session-basierte Authentifizierung
- Row Level Security (RLS) in PostgreSQL
- User können nur eigene Daten sehen/bearbeiten
- Automatische Session-Verwaltung

#### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

#### Error Handling
- Generische Error Messages für User
- Keine sensiblen DB-Details in Fehlermeldungen
- Error-Sanitization in `sanitizeErrorMessage()`

### Empfohlene zusätzliche Security-Maßnahmen

#### Rate Limiting (TODO)
```javascript
// Implementierung mit Supabase Edge Functions oder Cloudflare
// Limits:
// - Login: 5 Versuche pro 15 Minuten
// - API-Calls: 100 Requests pro Minute
// - Registration: 3 Versuche pro Stunde
```

#### Content Security Policy (TODO)
```html
<!-- In index.html oder als HTTP Header -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               connect-src 'self' https://*.supabase.co;">
```

#### HTTPS Enforcement (Production)
- Immer HTTPS verwenden
- HSTS Header setzen
- Secure Cookie Flags

#### Weitere Empfehlungen
- Regelmäßige Dependency-Updates (`npm audit`)
- 2FA für User-Accounts (zukünftig)
- Audit-Logging für kritische Aktionen
- Backup-Strategie für Datenbank
- GDPR-Compliance (Datenschutz-Features)

## SEO & Meta-Tags

### Implementiert
- ✅ Semantisches HTML
- ✅ Meta Description
- ✅ Open Graph Tags (Facebook)
- ✅ Twitter Cards
- ✅ Strukturierte Daten bereit
- ✅ robots.txt
- ✅ Mobile-optimiert
- 🔄 Sitemap.xml (TODO)

## PWA (Progressive Web App)

### Implementiert
- ✅ manifest.json
- ✅ Theme Color (#8B5CF6)
- ✅ Icons-Platzhalter (verschiedene Größen)
- ✅ App-Shortcuts
- 🔄 Service Worker (TODO)
- 🔄 Offline-Funktionalität (TODO)

### Icons Generieren
```bash
# Icons müssen noch erstellt werden in public/icons/
# Benötigte Größen: 72, 96, 128, 144, 152, 192, 384, 512
# Tool-Empfehlung: https://realfavicongenerator.net/
```
