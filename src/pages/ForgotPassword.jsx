import React, { useState } from 'react'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              E-Mail gesendet!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Falls ein Account mit dieser E-Mail existiert, erhältst du einen Reset-Link.
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-500/25"
            >
              <ArrowLeft className="w-5 h-5" />
              Zurück zum Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Passwort vergessen?
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              E-Mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="deine@email.de"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
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
            {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
