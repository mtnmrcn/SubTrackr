import React, { useState } from 'react'
import { UserPlus, Mail, Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Register({ onSwitchToLogin }) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Bitte fülle alle Felder aus')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await signUp(email, password)

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Diese E-Mail ist bereits registriert')
      } else if (signUpError.message.includes('invalid email')) {
        setError('Ungültige E-Mail-Adresse')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Clear form
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            SubTrackr
          </h1>
          <p className="text-slate-400">Erstelle dein kostenloses Konto</p>
        </div>

        {/* Register Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <UserPlus className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Registrieren</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-green-400 text-sm">
                <p className="font-medium mb-1">Registrierung erfolgreich!</p>
                <p className="text-green-400/80">
                  Bitte überprüfe deine E-Mails und bestätige dein Konto.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                E-Mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Passwort wiederholen"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-500/25 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrierung läuft...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Konto erstellen
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Bereits ein Konto?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Jetzt anmelden
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Verwalte deine Abonnements effizient
        </p>
      </div>
    </div>
  )
}

export default Register
