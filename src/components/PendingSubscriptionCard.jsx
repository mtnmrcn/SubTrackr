import React from 'react'
import {
  FileText,
  Check,
  X,
  Edit3,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react'
import { billingCycles } from '../data/sampleData'

function PendingSubscriptionCard({
  pending,
  onConfirm,
  onEdit,
  onReject,
  onRetry
}) {
  const formatPrice = (price, currency = 'EUR') => {
    if (!price) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getBillingCycleLabel = (cycle) => {
    const found = billingCycles.find(c => c.value === cycle)
    return found ? found.label : cycle || '-'
  }

  const getConfidenceColor = (score) => {
    if (!score) return 'bg-slate-200 dark:bg-slate-700'
    if (score >= 0.8) return 'bg-green-500'
    if (score >= 0.5) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getConfidenceLabel = (score) => {
    if (!score) return 'Unbekannt'
    if (score >= 0.8) return 'Hoch'
    if (score >= 0.5) return 'Mittel'
    return 'Niedrig'
  }

  const getStatusBadge = () => {
    switch (pending.status) {
      case 'uploading':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            Wird hochgeladen
          </span>
        )
      case 'processing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            Wird analysiert
          </span>
        )
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Warte auf Bestätigung
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
            <AlertCircle className="w-3 h-3" />
            Fehler
          </span>
        )
      default:
        return null
    }
  }

  const isProcessing = pending.status === 'uploading' || pending.status === 'processing'
  const isError = pending.status === 'error'
  const isPending = pending.status === 'pending'

  return (
    <div className={`
      glass-card bg-white/70 dark:bg-slate-800/50 rounded-2xl p-4
      border transition-all duration-200
      ${isError
        ? 'border-red-200 dark:border-red-500/30'
        : 'border-slate-100 dark:border-slate-700/50'
      }
    `}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* File Icon */}
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            ${isError
              ? 'bg-red-100 dark:bg-red-500/20'
              : 'bg-purple-100 dark:bg-purple-500/20'
            }
          `}>
            <FileText className={`w-6 h-6 ${isError ? 'text-red-500' : 'text-purple-500'}`} />
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 dark:text-white">
              {pending.parsed_name || pending.original_filename}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pending.original_filename}
            </p>
          </div>
        </div>

        {getStatusBadge()}
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="flex items-center justify-center py-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {pending.status === 'uploading'
                ? 'Datei wird hochgeladen...'
                : 'Rechnung wird analysiert...'
              }
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Fehler bei der Verarbeitung
              </p>
              <p className="text-xs text-red-500 dark:text-red-400/80 mt-1">
                {pending.error_message || 'Ein unbekannter Fehler ist aufgetreten'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Parsed Data */}
      {isPending && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {/* Price */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Preis</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {formatPrice(pending.parsed_price, pending.parsed_currency)}
              </p>
            </div>

            {/* Billing Cycle */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Zyklus</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {getBillingCycleLabel(pending.parsed_billing_cycle)}
              </p>
            </div>

            {/* Next Payment */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Datum</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {formatDate(pending.parsed_next_payment)}
              </p>
            </div>

            {/* Category */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Kategorie</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {pending.parsed_category || '-'}
              </p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Erkennungs-Sicherheit
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {getConfidenceLabel(pending.confidence_score)}
                  {pending.confidence_score && ` (${Math.round(pending.confidence_score * 100)}%)`}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${getConfidenceColor(pending.confidence_score)}`}
                  style={{ width: `${(pending.confidence_score || 0) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Google Drive Link */}
          {pending.google_drive_url && (
            <a
              href={pending.google_drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-600 mb-4"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Original in Google Drive ansehen
            </a>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        {isPending && (
          <>
            <button
              onClick={() => onConfirm && onConfirm(pending)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-xl transition-all"
            >
              <Check className="w-4 h-4" />
              Bestätigen
            </button>

            <button
              onClick={() => onEdit && onEdit(pending)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Bearbeiten
            </button>

            <button
              onClick={() => onReject && onReject(pending.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}

        {isError && (
          <>
            <button
              onClick={() => onRetry && onRetry(pending)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-sm font-medium rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Erneut versuchen
            </button>

            <button
              onClick={() => onReject && onReject(pending.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              Löschen
            </button>
          </>
        )}

        {isProcessing && (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center w-full">
            Bitte warten...
          </p>
        )}
      </div>
    </div>
  )
}

export default PendingSubscriptionCard
