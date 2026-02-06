# SubTrackr - Feature Implementation Guide

Dieses Dokument beschreibt die verbleibenden Features, die implementiert werden sollten.

## ✅ Bereits implementiert

1. **Toast Notifications** (src/components/Toast.jsx)
2. **CSV Export** (src/lib/export.js - exportToCSV)
3. **Chart Data Utilities** (src/lib/export.js - getMonthlyChartData)
4. **Input Validation** (src/lib/validation.js)

## 🔄 Zu implementieren

### 1. Dashboard Erweiterungen

#### Search & Filter Bar
```jsx
// In Dashboard.jsx vor der Subscription-Liste hinzufügen
const [searchTerm, setSearchTerm] = useState('')
const [categoryFilter, setCategory Filter] = useState('all')
const [statusFilter, setStatusFilter] = useState('active') // 'all', 'active', 'inactive'
const [sortBy, setSortBy] = useState('name-asc') // 'name-asc', 'name-desc', 'price-asc', 'price-desc', 'date-asc'

// Filter-Logik
const filteredSubscriptions = subscriptions
  .filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || sub.category === categoryFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' ? sub.active : !sub.active)
    return matchesSearch && matchesCategory && matchesStatus
  })
  .sort((a, b) => {
    switch(sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name)
      case 'name-desc': return b.name.localeCompare(a.name)
      case 'price-asc': return a.price - b.price
      case 'price-desc': return b.price - a.price
      case 'date-asc': return new Date(a.nextPayment) - new Date(b.nextPayment)
      default: return 0
    }
  })
```

#### UI-Komponenten
```jsx
{/* Suchfeld */}
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
  <input
    type="text"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Abonnements durchsuchen..."
    className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg..."
  />
</div>

{/* Filter-Buttons */}
<div className="flex gap-2">
  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
    <option value="all">Alle Kategorien</option>
    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
  </select>

  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
    <option value="name-asc">Name (A-Z)</option>
    <option value="name-desc">Name (Z-A)</option>
    <option value="price-asc">Preis (aufsteigend)</option>
    <option value="price-desc">Preis (absteigend)</option>
    <option value="date-asc">Zahlung (bald zuerst)</option>
  </select>
</div>
```

### 2. SubscriptionModal Erweiterungen

Füge folgende Felder hinzu:

```jsx
// State erweitern
const [formData, setFormData] = useState({
  // ... bestehende Felder
  website: '',
  notes: ''
})

// Im Form hinzufügen:
{/* Website URL */}
<div>
  <label>Website (optional)</label>
  <div className="relative">
    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
    <input
      type="url"
      name="website"
      value={formData.website}
      onChange={handleChange}
      placeholder="https://..."
      className="w-full pl-11 pr-4 py-2.5..."
    />
  </div>
</div>

{/* Notizen */}
<div>
  <label>Notizen (optional)</label>
  <textarea
    name="notes"
    value={formData.notes}
    onChange={handleChange}
    rows={3}
    placeholder="Persönliche Notizen..."
    className="w-full px-4 py-2.5..."
  />
</div>
```

### 3. SubscriptionCard Verbess erungen

```jsx
// Farbiger linker Rand
<div className="relative">
  <div
    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
    style={{ backgroundColor: subscription.color }}
  />
  <div className="pl-5"> {/* Content */}
    {/* ... */}

    {/* Website Link (wenn vorhanden) */}
    {subscription.website && (
      <a
        href={subscription.website}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
      >
        <ExternalLink className="w-4 h-4" />
        Website öffnen
      </a>
    )}

    {/* Notizen (wenn vorhanden) */}
    {subscription.notes && (
      <div className="mt-2 p-2 bg-slate-900/30 rounded text-xs text-slate-400">
        {subscription.notes}
      </div>
    )}
  </div>
</div>
```

### 4. Yearly Overview Chart

Erstelle neue Komponente: `src/components/YearlyChart.jsx`

```jsx
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getMonthlyChartData } from '../lib/export'

function YearlyChart({ subscriptions }) {
  const data = getMonthlyChartData(subscriptions)

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
      <h3 className="text-xl font-semibold text-white mb-4">
        Jahresübersicht
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '0.5rem'
            }}
          />
          <Bar dataKey="kosten" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default YearlyChart
```

### 5. Export Button im Dashboard

```jsx
import { Download } from 'lucide-react'
import { exportToCSV } from '../lib/export'

// Im Header neben "Neues Abo"
<button
  onClick={() => {
    try {
      exportToCSV(subscriptions)
      showToast('Export erfolgreich!', 'success')
    } catch (error) {
      showToast('Export fehlgeschlagen', 'error')
    }
  }}
  className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600..."
>
  <Download className="w-5 h-5" />
  Exportieren
</button>
```

### 6. Toast Integration im Dashboard

```jsx
import Toast from './Toast'

// State
const [toast, setToast] = useState(null)

// Helper
const showToast = (message, type = 'success') => {
  setToast({ message, type })
}

// In CRUD-Operationen
const handleSave = async (subscription) => {
  if (editingSubscription) {
    const result = await editSubscription(editingSubscription.id, subscription)
    if (result.success) {
      showToast('Abo erfolgreich aktualisiert!', 'success')
    } else {
      showToast('Fehler beim Speichern', 'error')
    }
  } else {
    const result = await addSubscription(subscription)
    if (result.success) {
      showToast('Abo erfolgreich hinzugefügt!', 'success')
    } else {
      showToast('Fehler beim Hinzufügen', 'error')
    }
  }
}

// Im JSX am Ende
{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}
```

### 7. Schema-Update für neue Felder

Füge in `sql/schema.sql` hinzu:

```sql
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS website VARCHAR(500),
ADD COLUMN IF NOT EXISTS notes TEXT;
```

Und in `src/services/subscriptionService.js`:

```javascript
// In createSubscription und updateSubscription
website: subscriptionData.website || null,
notes: subscriptionData.notes || null,
```

## Installation der Änderungen

1. Schema-Update in Supabase ausführen
2. Komponenten wie beschrieben erweitern
3. Features nach und nach hinzufügen
4. Testen!

## Icons die benötigt werden

```bash
import { Search, Download, Globe, ExternalLink, SlidersHorizontal } from 'lucide-react'
```
