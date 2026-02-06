import React, { useState } from 'react'
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Login({ onSwitchToRegister, onSwitchToForgotPassword }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!email || !password) {
      setError('Bitte fülle alle Felder aus')
      setLoading(false)
      return
    }

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Ungültige E-Mail oder Passwort')
      } else if (signInError.message.includes('Email not confirmed')) {
        setError('Bitte bestätige deine E-Mail-Adresse')
      } else {
        setError(signInError.message)
      }
      setLoading(false)
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
          <p className="text-slate-400">Melde dich an, um fortzufahren</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <LogIn className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Anmelden</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
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
                  placeholder="••••••••"
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
                  Anmelden...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Anmelden
                </>
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <button
              onClick={onSwitchToForgotPassword}
              className="text-sm text-slate-400 hover:text-purple-400 transition-colors"
            >
              Passwort vergessen?
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-4 text-center">
            <p className="text-slate-400 text-sm">
              Noch kein Konto?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Jetzt registrieren
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

export default Login
