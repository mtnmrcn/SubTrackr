import React from 'react'
import { CreditCard, Plus } from 'lucide-react'

function EmptyState({ onAddNew }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-12 border border-slate-700/50 text-center">
      <div className="mb-6">
        <CreditCard className="w-20 h-20 text-slate-600 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-white mb-2">
          Noch keine Abonnements
        </h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Füge dein erstes Abonnement hinzu, um den Überblick über deine monatlichen Kosten zu behalten.
        </p>
      </div>
      <button
        onClick={onAddNew}
        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-500/25"
      >
        <Plus className="w-5 h-5" />
        Erstes Abo hinzufügen
      </button>
    </div>
  )
}

export default EmptyState
