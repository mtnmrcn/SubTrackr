import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Dashboard from './components/Dashboard'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Toast from './components/Toast'
import { Loader2 } from 'lucide-react'

function AuthenticatedApp() {
  const { user, loading } = useAuth()
  const [view, setView] = useState('login') // 'login', 'register', 'forgot-password', 'reset-password'
  const [appView, setAppView] = useState('dashboard') // 'dashboard', 'profile'
  const [toast, setToast] = useState(null)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)

  // Check for password reset hash in URL on mount
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))

    // Check for errors first
    const error = hashParams.get('error')
    const errorDescription = hashParams.get('error_description')

    if (error) {
      let errorMessage = 'Ein Fehler ist aufgetreten.'

      if (error === 'access_denied' && errorDescription?.includes('expired')) {
        errorMessage = 'Dieser Reset-Link ist abgelaufen. Bitte fordere einen neuen an.'
      } else if (errorDescription) {
        errorMessage = errorDescription.replace(/\+/g, ' ')
      }

      showToast(errorMessage, 'error')
      window.location.hash = ''
      setView('forgot-password')
      return
    }

    // Check for recovery type
    if (hashParams.get('type') === 'recovery') {
      setView('reset-password')
      setIsRecoveryMode(true)
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleResetPasswordSuccess = (message) => {
    showToast(message, 'success')
    // Clear hash and recovery mode
    window.location.hash = ''
    setIsRecoveryMode(false)
    setView('login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Lädt...</p>
        </div>
      </div>
    )
  }

  // Show reset password page even if user is logged in (recovery mode)
  if (isRecoveryMode && view === 'reset-password') {
    return (
      <>
        <ResetPassword onSuccess={handleResetPasswordSuccess} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    )
  }

  if (!user) {
    return (
      <>
        {view === 'register' && (
          <Register onSwitchToLogin={() => setView('login')} />
        )}
        {view === 'login' && (
          <Login
            onSwitchToRegister={() => setView('register')}
            onSwitchToForgotPassword={() => setView('forgot-password')}
          />
        )}
        {view === 'forgot-password' && (
          <ForgotPassword onBackToLogin={() => setView('login')} />
        )}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    )
  }

  return (
    <>
      {appView === 'dashboard' && (
        <Dashboard onNavigateToProfile={() => setAppView('profile')} />
      )}
      {appView === 'profile' && (
        <Profile onBack={() => setAppView('dashboard')} />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
