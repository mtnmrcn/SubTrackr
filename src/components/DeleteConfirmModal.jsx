import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

function DeleteConfirmModal({ isOpen, onClose, onConfirm, subscriptionName }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-red-500/50 dark:border-red-500/50 w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Abo löschen</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 mb-2">
            Möchtest du <span className="font-semibold text-slate-900 dark:text-white">"{subscriptionName}"</span> wirklich löschen?
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-medium rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal
