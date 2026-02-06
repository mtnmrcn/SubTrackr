import React, { useState } from 'react'
import {
  Euro,
  Calendar,
  CreditCard,
  TrendingUp,
  Plus,
  AlertCircle,
  Tag,
  Loader2,
  AlertTriangle,
  LogOut,
  Search,
  Download,
  Zap,
  Sun,
  Moon,
  User,
  LayoutDashboard,
  Settings,
  PieChart,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  ScanLine,
  FileText
} from 'lucide-react'
import StatsCard from './StatsCard'
import SubscriptionCard from './SubscriptionCard'
import SubscriptionModal from './SubscriptionModal'
import Toast from './Toast'
import DeleteConfirmModal from './DeleteConfirmModal'
import EmptyState from './EmptyState'
import YearlyChart from './YearlyChart'
import ReceiptUpload from './ReceiptUpload'
import PendingSubscriptionCard from './PendingSubscriptionCard'
import ConfirmSubscriptionModal from './ConfirmSubscriptionModal'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { usePendingSubscriptions } from '../hooks/usePendingSubscriptions'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { categories, paymentMethods } from '../data/sampleData'
import { exportToCSV } from '../lib/export'
import { convertToEUR } from '../lib/currency'

function Dashboard({ onNavigateToProfile }) {
  const { signOut, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const {
    subscriptions,
    loading,
    error,
    isAuthenticated,
    addSubscription,
    editSubscription,
    removeSubscription,
    refresh: refreshSubscriptions
  } = useSubscriptions()

  // Pending Subscriptions (Receipt Scanner)
  const {
    pending: pendingSubscriptions,
    uploading: receiptUploading,
    counts: pendingCounts,
    uploadAndProcessReceipt,
    confirmPending,
    rejectPending,
    retryProcessing
  } = usePendingSubscriptions()

  // Navigation State
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' | 'subscriptions' | 'statistics' | 'scanner'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name-asc')
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Receipt Scanner States
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pendingToConfirm, setPendingToConfirm] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const getDisplayName = () => {
    const savedProfile = localStorage.getItem(`profile_${user?.id}`)
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile)
      if (parsed.display_name) return parsed.display_name
    }
    return user?.email?.split('@')[0] || 'User'
  }

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const calculateMonthlyTotal = () => {
    return subscriptions.reduce((total, sub) => {
      if (!sub.active || sub.billingCycle === 'one_time') return total
      const priceInEUR = convertToEUR(sub.price, sub.currency)
      if (sub.billingCycle === 'monthly') {
        return total + priceInEUR
      } else if (sub.billingCycle === 'quarterly') {
        return total + (priceInEUR / 3)
      } else {
        return total + (priceInEUR / 12)
      }
    }, 0)
  }

  const calculateOneTimeTotal = () => {
    const currentYear = new Date().getFullYear()
    return subscriptions.reduce((total, sub) => {
      if (!sub.active || sub.billingCycle !== 'one_time') return total
      const paymentDate = new Date(sub.nextPayment)
      if (paymentDate.getFullYear() === currentYear) {
        const priceInEUR = convertToEUR(sub.price, sub.currency)
        return total + priceInEUR
      }
      return total
    }, 0)
  }

  const calculateYearlyTotal = () => {
    return subscriptions.reduce((total, sub) => {
      if (!sub.active || sub.billingCycle === 'one_time') return total
      const priceInEUR = convertToEUR(sub.price, sub.currency)
      if (sub.billingCycle === 'yearly') {
        return total + priceInEUR
      } else if (sub.billingCycle === 'quarterly') {
        return total + (priceInEUR * 4)
      } else {
        return total + (priceInEUR * 12)
      }
    }, 0)
  }

  const getUpcomingPayments = () => {
    const today = new Date()
    return subscriptions.filter(sub => {
      if (!sub.active || sub.billingCycle === 'one_time') return false
      const paymentDate = new Date(sub.nextPayment)
      const diffTime = paymentDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7 && diffDays >= 0
    }).sort((a, b) => new Date(a.nextPayment) - new Date(b.nextPayment))
  }

  const getSubscriptionsByCategory = () => {
    const categoryMap = {}
    subscriptions.forEach(sub => {
      if (!sub.active) return
      if (!categoryMap[sub.category]) {
        categoryMap[sub.category] = {
          count: 0,
          total: 0
        }
      }
      categoryMap[sub.category].count++
      const priceInEUR = convertToEUR(sub.price, sub.currency)
      let monthlyPrice
      if (sub.billingCycle === 'one_time') {
        monthlyPrice = 0
      } else if (sub.billingCycle === 'monthly') {
        monthlyPrice = priceInEUR
      } else if (sub.billingCycle === 'quarterly') {
        monthlyPrice = priceInEUR / 3
      } else {
        monthlyPrice = priceInEUR / 12
      }
      categoryMap[sub.category].total += monthlyPrice
    })
    return Object.entries(categoryMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total)
  }

  const getTopExpensiveSubscriptions = () => {
    return subscriptions
      .filter(sub => sub.active && sub.billingCycle !== 'one_time')
      .map(sub => {
        const priceInEUR = convertToEUR(sub.price, sub.currency)
        let monthlyPrice
        if (sub.billingCycle === 'monthly') {
          monthlyPrice = priceInEUR
        } else if (sub.billingCycle === 'quarterly') {
          monthlyPrice = priceInEUR / 3
        } else {
          monthlyPrice = priceInEUR / 12
        }
        return { ...sub, monthlyPrice }
      })
      .sort((a, b) => b.monthlyPrice - a.monthlyPrice)
      .slice(0, 5)
  }

  const formatPrice = (price, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short'
    })
  }

  const filteredAndSortedSubscriptions = subscriptions
    .filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || sub.category === categoryFilter
      const matchesType = typeFilter === 'all' ||
        (typeFilter === 'recurring' && sub.billingCycle !== 'one_time') ||
        (typeFilter === 'one_time' && sub.billingCycle === 'one_time')
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && sub.active) ||
        (statusFilter === 'paused' && !sub.active)
      const matchesPaymentMethod = paymentMethodFilter === 'all' || sub.paymentMethod === paymentMethodFilter
      return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesPaymentMethod
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

  const handleSave = async (subscription) => {
    if (editingSubscription) {
      const result = await editSubscription(editingSubscription.id, subscription)
      if (result.success) {
        showToast('Abo erfolgreich aktualisiert!', 'success')
        setIsModalOpen(false)
      } else {
        showToast('Fehler beim Speichern', 'error')
      }
    } else {
      const result = await addSubscription(subscription)
      if (result.success) {
        showToast('Abo erfolgreich hinzugefügt!', 'success')
        setIsModalOpen(false)
      } else {
        showToast('Fehler beim Hinzufügen', 'error')
      }
    }
    setEditingSubscription(null)
  }

  const handleEdit = (subscription) => {
    setEditingSubscription(subscription)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    setDeleteConfirm(null)
    const result = await removeSubscription(id)
    if (result.success) {
      showToast('Abo erfolgreich gelöscht!', 'success')
    } else {
      showToast('Fehler beim Löschen', 'error')
    }
  }

  const handleAddNew = () => {
    setEditingSubscription(null)
    setIsModalOpen(true)
  }

  const handleExport = () => {
    try {
      exportToCSV(subscriptions)
      showToast('Export erfolgreich!', 'success')
    } catch (err) {
      showToast('Export fehlgeschlagen', 'error')
    }
  }

  const handleToggleActive = async (id, currentStatus) => {
    const result = await editSubscription(id, { active: !currentStatus })
    if (result.success) {
      showToast(
        currentStatus ? 'Abo pausiert!' : 'Abo fortgesetzt!',
        'success'
      )
    } else {
      showToast('Fehler beim Aktualisieren', 'error')
    }
  }

  const handleNavigation = (view) => {
    if (view === 'settings') {
      onNavigateToProfile()
    } else {
      setCurrentView(view)
    }
    setSidebarOpen(false)
  }

  const monthlyTotal = calculateMonthlyTotal()
  const yearlyTotal = calculateYearlyTotal()
  const oneTimeTotal = calculateOneTimeTotal()
  const upcomingPayments = getUpcomingPayments()
  const categoriesData = getSubscriptionsByCategory()
  const topExpensive = getTopExpensiveSubscriptions()

  // Calculate recurring vs one-time totals
  const recurringCount = subscriptions.filter(s => s.active && s.billingCycle !== 'one_time').length
  const oneTimeCount = subscriptions.filter(s => s.active && s.billingCycle === 'one_time').length

  if (loading) {
    return (
      <div className="min-h-screen prodify-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Lade Abonnements...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen prodify-bg flex items-center justify-center p-6">
        <div className="glass-card bg-white/80 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-700/50 max-w-md text-center shadow-xl">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Nicht angemeldet</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Du musst angemeldet sein, um deine Abonnements zu verwalten.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen prodify-bg flex items-center justify-center p-6">
        <div className="glass-card bg-white/80 dark:bg-slate-800/50 rounded-3xl p-8 border border-red-200 dark:border-red-500/30 max-w-md text-center shadow-xl">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Fehler</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {error.message || 'Ein Fehler ist aufgetreten'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all shadow-lg"
          >
            Neu laden
          </button>
        </div>
      </div>
    )
  }

  // Receipt Scanner Handlers
  const handleReceiptUpload = async (file) => {
    const result = await uploadAndProcessReceipt(file)
    if (result.success) {
      showToast('Rechnung wird verarbeitet...', 'success')
    } else {
      showToast(result.error?.message || 'Upload fehlgeschlagen', 'error')
    }
    return result
  }

  const handleConfirmPending = (pending) => {
    setPendingToConfirm(pending)
    setConfirmModalOpen(true)
  }

  const handleConfirmSubmit = async (pendingId, subscriptionData) => {
    const result = await confirmPending(pendingId, subscriptionData)
    if (result.success) {
      showToast('Abo erfolgreich erstellt!', 'success')
      // Refresh subscription list to include the newly confirmed subscription
      refreshSubscriptions()
    } else {
      showToast('Fehler beim Erstellen des Abos', 'error')
    }
  }

  const handleRejectPending = async (pendingId) => {
    const result = await rejectPending(pendingId)
    if (result.success) {
      showToast('Erkennung gelöscht', 'success')
    } else {
      showToast('Fehler beim Löschen', 'error')
    }
  }

  const handleRetryPending = async (pending) => {
    const result = await retryProcessing(pending)
    if (result.success) {
      showToast('Verarbeitung wird wiederholt...', 'success')
    } else {
      showToast('Fehler beim Wiederholen', 'error')
    }
  }

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Alle Abos', icon: CreditCard },
    { id: 'scanner', label: 'Scanner', icon: ScanLine, badge: pendingCounts.pending > 0 ? pendingCounts.pending : null },
    { id: 'statistics', label: 'Statistiken', icon: PieChart },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
  ]

  // Filter Component (reusable)
  const FilterBar = ({ fullWidth = false }) => (
    <div className={`glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 ${fullWidth ? '' : ''}`}>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Suchen..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <option value="all">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="paused">Pausiert</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <option value="all">Alle Typen</option>
          <option value="recurring">Wiederkehrend</option>
          <option value="one_time">Einmalig</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <option value="all">Alle Kategorien</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="price-asc">Preis ↑</option>
          <option value="price-desc">Preis ↓</option>
          <option value="date-asc">Datum</option>
        </select>
      </div>
    </div>
  )

  // Render content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'subscriptions':
        return (
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Alle Abonnements</h2>
                <p className="text-slate-500 dark:text-slate-400">{subscriptions.length} Abonnements insgesamt</p>
              </div>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-5 h-5" />
                Neues Abo
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatsCard icon={CreditCard} label="Aktive Abos" value={recurringCount} subtitle="Wiederkehrend" color="purple" />
              <StatsCard icon={Zap} label="Einmalige" value={oneTimeCount} subtitle="Zahlungen" color="pink" />
              <StatsCard icon={Euro} label="Monatlich" value={formatPrice(monthlyTotal)} subtitle="Ø Kosten" color="teal" />
              <StatsCard icon={TrendingUp} label="Jährlich" value={formatPrice(yearlyTotal)} subtitle="Hochrechnung" color="blue" />
            </div>

            {/* Filters */}
            <FilterBar fullWidth />

            {/* Subscriptions List */}
            <div className="space-y-3">
              {filteredAndSortedSubscriptions.length > 0 ? (
                filteredAndSortedSubscriptions.map(sub => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteConfirm(subscriptions.find(s => s.id === id))}
                    onToggleActive={handleToggleActive}
                  />
                ))
              ) : subscriptions.length > 0 ? (
                <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700/50">
                  <p className="text-slate-500 dark:text-slate-400">Keine Abonnements gefunden</p>
                </div>
              ) : (
                <EmptyState onAddNew={handleAddNew} />
              )}
            </div>
          </div>
        )

      case 'scanner':
        return (
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Rechnungs-Scanner</h2>
                <p className="text-slate-500 dark:text-slate-400">Rechnungen hochladen und automatisch erkennen</p>
              </div>
            </div>

            {/* Upload Section */}
            <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <ScanLine className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Rechnung scannen</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">PDF oder Foto hochladen</p>
                </div>
              </div>
              <ReceiptUpload
                onUpload={handleReceiptUpload}
                uploading={receiptUploading}
              />
            </div>

            {/* Stats */}
            {pendingCounts.total > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard
                  icon={FileText}
                  label="Ausstehend"
                  value={pendingCounts.pending}
                  subtitle="Warten auf Bestätigung"
                  color="amber"
                />
                <StatsCard
                  icon={Loader2}
                  label="In Verarbeitung"
                  value={pendingCounts.processing}
                  subtitle="Werden analysiert"
                  color="purple"
                />
                <StatsCard
                  icon={AlertCircle}
                  label="Fehler"
                  value={pendingCounts.error}
                  subtitle="Benötigen Aufmerksamkeit"
                  color="red"
                />
              </div>
            )}

            {/* Pending Subscriptions List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Erkannte Rechnungen
              </h3>

              {pendingSubscriptions.length > 0 ? (
                <div className="space-y-3">
                  {pendingSubscriptions.map(pending => (
                    <PendingSubscriptionCard
                      key={pending.id}
                      pending={pending}
                      onConfirm={handleConfirmPending}
                      onEdit={handleConfirmPending}
                      onReject={handleRejectPending}
                      onRetry={handleRetryPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700/50">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">Keine ausstehenden Erkennungen</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Lade eine Rechnung hoch, um zu beginnen
                  </p>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">So funktioniert's</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-500 font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">Hochladen</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">PDF oder Foto der Rechnung hochladen</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-500 font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">Analysieren</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">KI erkennt automatisch die Daten</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-500 font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">Bestätigen</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Daten prüfen und als Abo speichern</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'statistics':
        return (
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Statistiken</h2>
              <p className="text-slate-500 dark:text-slate-400">Übersicht deiner Ausgaben und Trends</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard icon={Euro} label="Monatliche Kosten" value={formatPrice(monthlyTotal)} subtitle="Wiederkehrend" color="purple" />
              <StatsCard icon={TrendingUp} label="Jährliche Kosten" value={formatPrice(yearlyTotal)} subtitle="Hochrechnung" color="teal" />
              <StatsCard icon={Zap} label={`Einmalig (${new Date().getFullYear()})`} value={formatPrice(oneTimeTotal)} subtitle={`${oneTimeCount} Zahlungen`} color="pink" />
              <StatsCard icon={CreditCard} label="Aktive Abos" value={recurringCount + oneTimeCount} subtitle={`${subscriptions.length} gesamt`} color="blue" />
            </div>

            {/* Large Chart */}
            <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Cashflow-Übersicht</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Erwartete Ausgaben der nächsten 12 Monate</p>
                </div>
              </div>
              <YearlyChart subscriptions={subscriptions} />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown with Percentages */}
              <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-500/20 rounded-xl flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Ausgaben nach Kategorie</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Monatliche Kosten-Verteilung</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {categoriesData.length > 0 ? categoriesData.map(({ category, count, total }) => {
                    const percentage = monthlyTotal > 0 ? ((total / monthlyTotal) * 100).toFixed(1) : 0
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-white">{category}</span>
                            <span className="text-xs text-slate-400">({count} {count === 1 ? 'Abo' : 'Abos'})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-white">{formatPrice(total)}</span>
                            <span className="text-xs text-purple-500 font-medium">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  }) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Keine aktiven Abonnements</p>
                  )}
                </div>
              </div>

              {/* Top 5 Expensive */}
              <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-500/20 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Top 5 teuerste Abos</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Monatliche Kosten</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {topExpensive.length > 0 ? topExpensive.map((sub, index) => (
                    <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: sub.color }}
                      >
                        {sub.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{sub.name}</p>
                        <p className="text-xs text-slate-400">{sub.category}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{formatPrice(sub.monthlyPrice)}/mtl.</p>
                    </div>
                  )) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Keine wiederkehrenden Abonnements</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recurring vs One-Time Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Wiederkehrende Abos</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{recurringCount}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Monatliche Kosten</span>
                  <span className="text-lg font-bold text-purple-500">{formatPrice(monthlyTotal)}</span>
                </div>
              </div>

              <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-500/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Einmalige Zahlungen</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{oneTimeCount}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Dieses Jahr</span>
                  <span className="text-lg font-bold text-pink-500">{formatPrice(oneTimeTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )

      default: // dashboard
        return (
          <>
            {/* Quick Actions */}
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/25"
                >
                  <Plus className="w-5 h-5" />
                  Neues Abo hinzufügen
                </button>
                <button
                  onClick={() => setCurrentView('scanner')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                >
                  <ScanLine className="w-5 h-5" />
                  Rechnung scannen
                  {pendingCounts.pending > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                      {pendingCounts.pending}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-5 h-5" />
                  Exportieren
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsCard icon={Euro} label="Monatliche Kosten" value={formatPrice(monthlyTotal)} subtitle="Wiederkehrend" color="purple" />
                <StatsCard icon={TrendingUp} label="Jährliche Kosten" value={formatPrice(yearlyTotal)} subtitle="Hochrechnung" color="teal" />
                <StatsCard icon={Zap} label={`Einmalig (${new Date().getFullYear()})`} value={formatPrice(oneTimeTotal)} subtitle={`${oneTimeCount} Zahlung(en)`} color="pink" />
                <StatsCard icon={CreditCard} label="Aktive Abos" value={recurringCount} subtitle={`${subscriptions.length} gesamt`} color="blue" />
                <StatsCard icon={AlertCircle} label="Bald fällig" value={upcomingPayments.length} subtitle="Nächste 7 Tage" color="amber" />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6 pb-8">
              <div className="flex flex-col xl:flex-row gap-6">
                {/* Left Column */}
                <div className="flex-1 space-y-6">
                  {/* Chart */}
                  <YearlyChart subscriptions={subscriptions} />

                  {/* Filters */}
                  <FilterBar />

                  {/* Subscriptions List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        Deine Abonnements
                      </h3>
                      <button
                        onClick={() => setCurrentView('subscriptions')}
                        className="text-sm text-purple-500 hover:text-purple-600 font-medium flex items-center gap-1"
                      >
                        Alle anzeigen
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    {filteredAndSortedSubscriptions.length > 0 ? (
                      <div className="space-y-3">
                        {filteredAndSortedSubscriptions.slice(0, 5).map(sub => (
                          <SubscriptionCard
                            key={sub.id}
                            subscription={sub}
                            onEdit={handleEdit}
                            onDelete={(id) => setDeleteConfirm(subscriptions.find(s => s.id === id))}
                            onToggleActive={handleToggleActive}
                          />
                        ))}
                        {filteredAndSortedSubscriptions.length > 5 && (
                          <button
                            onClick={() => setCurrentView('subscriptions')}
                            className="w-full py-3 text-center text-purple-500 hover:text-purple-600 font-medium glass-card bg-white/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors"
                          >
                            + {filteredAndSortedSubscriptions.length - 5} weitere Abos anzeigen
                          </button>
                        )}
                      </div>
                    ) : subscriptions.length > 0 ? (
                      <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700/50">
                        <p className="text-slate-500 dark:text-slate-400">Keine Abonnements gefunden</p>
                      </div>
                    ) : (
                      <EmptyState onAddNew={handleAddNew} />
                    )}
                  </div>
                </div>

                {/* Right Column - Sidebar Widgets */}
                <div className="xl:w-80 space-y-6">
                  {/* Upcoming Payments */}
                  <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-amber-500" />
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        Bald fällig
                      </h3>
                    </div>
                    {upcomingPayments.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingPayments.map(sub => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl"
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{ backgroundColor: sub.color }}
                            >
                              {sub.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                {sub.name}
                              </p>
                              <p className="text-xs text-amber-500">
                                {formatDate(sub.nextPayment)}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                              {formatPrice(sub.price, sub.currency)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500">
                        Keine Zahlungen in den nächsten 7 Tagen
                      </p>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Tag className="w-4 h-4 text-purple-500" />
                        </div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">
                          Nach Kategorie
                        </h3>
                      </div>
                      <button
                        onClick={() => setCurrentView('statistics')}
                        className="text-xs text-purple-500 hover:text-purple-600"
                      >
                        Details
                      </button>
                    </div>
                    <div className="space-y-2">
                      {categoriesData.slice(0, 4).map(({ category, count, total }) => (
                        <div
                          key={category}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                              {category}
                            </p>
                            <p className="text-xs text-slate-400">
                              {count} {count === 1 ? 'Abo' : 'Abos'}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">
                            {formatPrice(total)}
                          </p>
                        </div>
                      ))}
                      {categoriesData.length > 4 && (
                        <button
                          onClick={() => setCurrentView('statistics')}
                          className="w-full py-2 text-center text-xs text-purple-500 hover:text-purple-600"
                        >
                          + {categoriesData.length - 4} weitere
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen prodify-bg">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-72 glass-card bg-white/90 dark:bg-slate-900/90 border-r border-slate-100 dark:border-slate-700/50 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold gradient-text">SubTrackr</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = item.id === 'settings' ? false : currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-purple-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700/50">
            <div
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
              onClick={onNavigateToProfile}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                {getDisplayName().charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{getDisplayName()}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-30 glass-card bg-white/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-700/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl"
                >
                  <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Hallo, {getDisplayName()}! <span className="inline-block animate-pulse-soft">👋</span>
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {getFormattedDate()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                  title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                </button>
                <button
                  onClick={handleExport}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                  title="Exportieren"
                >
                  <Download className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={signOut}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                  title="Abmelden"
                >
                  <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        {renderContent()}
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingSubscription(null)
        }}
        onSave={handleSave}
        subscription={editingSubscription}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm.id)}
          subscriptionName={deleteConfirm.name}
        />
      )}

      {confirmModalOpen && (
        <ConfirmSubscriptionModal
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false)
            setPendingToConfirm(null)
          }}
          onConfirm={handleConfirmSubmit}
          pendingData={pendingToConfirm}
        />
      )}
    </div>
  )
}

export default Dashboard
