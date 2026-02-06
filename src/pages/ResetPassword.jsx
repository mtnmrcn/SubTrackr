import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

function ResetPassword({ onSuccess }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validToken, setValidToken] = useState(false)

  useEffect(() => {
    // Check if we have a valid recovery token
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setValidToken(true)
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (newPassword.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      // Success - call callback with toast message
      if (onSuccess) {
        onSuccess('Passwort erfolgreich geändert!')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Fehler beim Zurücksetzen des Passworts. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Ungültiger Link
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Dieser Reset-Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Neues Passwort setzen
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Wähle ein sicheres neues Passwort für deinen Account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Neues Passwort
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mindestens 6 Zeichen"
                className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Passwort bestätigen
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Passwort wiederholen"
                className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Wird gespeichert...' : 'Passwort ändern'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Das Passwort muss mindestens 6 Zeichen lang sein.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
