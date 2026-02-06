# SubTrackr - Abo-Verwaltung SaaS

## 📋 Projektübersicht

**SubTrackr** ist eine Web-App zur Verwaltung von Abonnements (SaaS, Tools, Services). 
- **Phase 1:** Persönliche Nutzung
- **Phase 2:** Multi-User SaaS mit monatlicher Bezahlung

---

## 🛠 Tech-Stack

| Komponente | Technologie | Grund |
|------------|-------------|-------|
| Frontend | React 18 + Vite | Schnell, modern, Hot Reload |
| Styling | Tailwind CSS | Utility-first, schnelle Entwicklung |
| Icons | Lucide React | Konsistent, lightweight |
| Backend | Supabase | Auth, DB, API, Realtime - alles in einem |
| Datenbank | PostgreSQL (via Supabase) | Robust, skalierbar |
| E-Mail | Resend oder n8n Workflow | Erinnerungen |
| Deployment | Vercel (später) | Einfach, kostenlos starten |

---

## 🚀 Lokale Einrichtung mit Claude Code

### 1. Projekt erstellen

```bash
# Neues Vite React Projekt
npm create vite@latest subtrackr -- --template react
cd subtrackr

# Dependencies installieren
npm install

# Zusätzliche Packages
npm install @supabase/supabase-js lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Tailwind konfigurieren

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Projektstruktur

```
subtrackr/
├── public/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── SubscriptionList.jsx
│   │   ├── SubscriptionCard.jsx
│   │   ├── SubscriptionModal.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Stats.jsx
│   │   └── CategoryChart.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Settings.jsx
│   ├── hooks/
│   │   ├── useSubscriptions.js
│   │   ├── useAuth.js
│   │   └── useReminders.js
│   ├── lib/
│   │   ├── supabase.js
│   │   └── utils.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.local
├── package.json
└── README.md
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

App läuft auf: `http://localhost:5173`

---

## 🗄 Supabase Setup

### 1. Supabase Projekt erstellen
1. Gehe zu [supabase.com](https://supabase.com)
2. Neues Projekt erstellen
3. API Keys kopieren

### 2. Environment Variables

**.env.local:**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx...
```

### 3. Supabase Client

**src/lib/supabase.js:**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 4. Datenbank Schema

Führe dieses SQL in Supabase SQL Editor aus:

```sql
-- Users Profil (erweitert auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  currency_default TEXT DEFAULT 'EUR',
  reminder_days_default INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kategorien
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366F1',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Kategorien für neue User
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, color) VALUES
    (NEW.id, 'AI Tools', '#8B5CF6'),
    (NEW.id, 'Hosting', '#3B82F6'),
    (NEW.id, 'Design', '#EC4899'),
    (NEW.id, 'Automation', '#F97316'),
    (NEW.id, 'Productivity', '#10B981'),
    (NEW.id, 'Marketing', '#EAB308'),
    (NEW.id, 'Other', '#6B7280');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Subscriptions (Haupttabelle)
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_payment_date DATE NOT NULL,
  reminder_days INTEGER DEFAULT 3,
  color TEXT DEFAULT '#6366F1',
  logo_url TEXT,
  website_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zahlungshistorie
CREATE TABLE payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Erinnerungen Log
CREATE TABLE reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Policies: User sieht nur eigene Daten
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own categories" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own payment_history" ON payment_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own reminders" ON reminders FOR ALL USING (auth.uid() = user_id);

-- Trigger: Profil erstellen bei Registrierung
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: Default Kategorien bei neuem User
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- Indexes für Performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_payment ON subscriptions(next_payment_date);
CREATE INDEX idx_categories_user_id ON categories(user_id);
```

---

## 📁 Komponenten Übersicht

### Bereits erstellt (Prototyp):
- [x] Dashboard mit Stats
- [x] Subscription Liste
- [x] Add/Edit Modal
- [x] Kategorie Filter
- [x] Suche
- [x] Upcoming Payments Sidebar

### Noch zu erstellen:
- [ ] Auth Pages (Login/Register)
- [ ] Supabase Integration
- [ ] Settings Page
- [ ] Zahlungshistorie
- [ ] E-Mail Erinnerungen (n8n)
- [ ] Dark/Light Mode Toggle
- [ ] Export (CSV/PDF)
- [ ] Stripe Integration (Phase 2)

---

## 🔄 n8n Workflow für Erinnerungen

Später einzurichten auf deinem VPS:

1. **Trigger:** Schedule (täglich 8:00 Uhr)
2. **Supabase Query:** Abos mit `next_payment_date - reminder_days = TODAY`
3. **Loop:** Für jedes Abo
4. **E-Mail senden:** Via SMTP oder Resend
5. **Update:** Reminder Status in DB

---

## 📝 Entwicklungs-Roadmap

### Phase 1: MVP (Persönliche Nutzung)
1. ✅ UI Prototyp
2. ⬜ Supabase Projekt aufsetzen
3. ⬜ Auth implementieren
4. ⬜ CRUD Operations mit Supabase
5. ⬜ Lokaler Test

### Phase 2: Feature Complete
1. ⬜ Zahlungshistorie
2. ⬜ n8n Reminder Workflow
3. ⬜ Settings Page
4. ⬜ Export Funktion
5. ⬜ PWA Setup

### Phase 3: SaaS Launch
1. ⬜ Stripe Integration
2. ⬜ Pricing Tiers (Free/Pro)
3. ⬜ Landing Page
4. ⬜ Deployment auf Vercel
5. ⬜ Custom Domain

---

## 💡 Befehle für Claude Code

Hier sind nützliche Prompts für die Entwicklung:

```
"Erstelle die Supabase Integration für useSubscriptions Hook"

"Implementiere Login und Register Pages mit Supabase Auth"

"Füge die Zahlungshistorie Komponente hinzu"

"Erstelle einen n8n Workflow für tägliche Erinnerungs-E-Mails"

"Mache die App responsive für Mobile"
```

---

## 🔗 Wichtige Links

- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/icons)
- [React Router](https://reactrouter.com/)

---

## ✅ Checkliste vor dem Start heute Abend

- [ ] Node.js installiert (v18+)
- [ ] Supabase Account erstellt
- [ ] Projekt-Ordner vorbereitet
- [ ] Claude Code bereit

---

*Erstellt: 31.12.2024 | Projekt: SubTrackr | Author: Metin & Claude*
