import React, { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Settings,
  Lock,
  ArrowLeft,
  Loader2,
  Save,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getOrCreateProfile, updateProfile } from '../services/profileService'
import { validatePassword } from '../lib/validation'
import { supabase } from '../lib/supabase'
import Toast from '../components/Toast'

function Profile({ onBack }) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [toast, setToast] = useState(null)

  // Profile data
  const [displayName, setDisplayName] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('EUR')

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await getOrCreateProfile(user.id)

    if (data) {
      setDisplayName(data.display_name || '')
      setDefaultCurrency(data.default_currency || 'EUR')
    } else if (error) {
      // Fallback: Load from localStorage if table doesn't exist
      const savedProfile = localStorage.getItem(`profile_${user.id}`)
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)
        setDisplayName(parsed.display_name || '')
        setDefaultCurrency(parsed.default_currency || 'EUR')
      }
      console.warn('Profiles table not found, using localStorage fallback')
    }

    setLoading(false)
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)

    const profileData = {
      display_name: displayName.trim() || null,
      default_currency: defaultCurrency
    }

    const { error } = await updateProfile(user.id, profileData)

    if (error) {
      // Fallback: Save to localStorage if table doesn't exist
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData))
      showToast('Profil lokal gespeichert!', 'success')
    } else {
      showToast('Profil gespeichert!', 'success')
    }

    setSaving(false)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    // Validate password
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      showToast(validation.message, 'error')
      return
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      showToast('Passwörter stimmen nicht überein', 'error')
      return
    }

    setChangingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      showToast('Fehler beim Ändern des Passworts', 'error')
    } else {
      showToast('Passwort erfolgreich geändert!', 'success')
      setNewPassword('')
      setConfirmPassword('')
    }

    setChangingPassword(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Lade Profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Profil & Einstellungen
              </h1>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-all"
              title={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Persönliche Daten */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Persönliche Daten
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Anzeigename
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dein Name"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-Mail
                </div>
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Die E-Mail-Adresse kann nicht geändert werden
              </p>
            </div>
          </div>
        </div>

        {/* Einstellungen */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Einstellungen
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Standard-Währung
            </label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        {/* Speichern Button */}
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Speichere...' : 'Speichern'}
        </button>

        {/* Passwort ändern */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Passwort ändern
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changingPassword ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
              {changingPassword ? 'Ändere...' : 'Passwort ändern'}
            </button>
          </form>
        </div>

        {/* Zurück zum Dashboard */}
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück zum Dashboard
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Profile
