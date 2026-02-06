import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  }

  const colors = {
    success: 'bg-green-50 dark:bg-green-500/10 border-green-300 dark:border-green-500/50 text-green-700 dark:text-green-400',
    error: 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-400',
    warning: 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-400'
  }

  return (
    <div className={`fixed top-4 right-4 z-50 min-w-80 max-w-md animate-slide-in`}>
      <div className={`${colors[type]} border rounded-lg p-4 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex items-start gap-3`}>
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-75 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
