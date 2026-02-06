import React, { useState, useEffect } from 'react'
import { X, Globe, AlertTriangle, ExternalLink } from 'lucide-react'
import { categories, currencies, billingCycles, paymentMethods } from '../data/sampleData'

const defaultColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16'
]

function ConfirmSubscriptionModal({ isOpen, onClose, onConfirm, pendingData = null }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Other',
    price: '',
    currency: 'EUR',
    billingCycle: 'monthly',
    paymentMethod: 'other',
    nextPayment: '',
    color: '#3B82F6',
    reminder: 3,
    active: true,
    website: '',
    notes: ''
  })

  const [lowConfidenceFields, setLowConfidenceFields] = useState([])

  // Populate form with pending data
  useEffect(() => {
    if (pendingData) {
      // Determine which fields have low confidence
      const lowConf = []
      if (pendingData.confidence_score && pendingData.confidence_score < 0.7) {
        // Mark all parsed fields as low confidence if overall score is low
        if (pendingData.parsed_name) lowConf.push('name')
        if (pendingData.parsed_price) lowConf.push('price')
        if (pendingData.parsed_billing_cycle) lowConf.push('billingCycle')
        if (pendingData.parsed_next_payment) lowConf.push('nextPayment')
        if (pendingData.parsed_category) lowConf.push('category')
      }
      setLowConfidenceFields(lowConf)

      // Format date for input
      let nextPaymentDate = ''
      if (pendingData.parsed_next_payment) {
        const date = new Date(pendingData.parsed_next_payment)
        nextPaymentDate = date.toISOString().split('T')[0]
      }

      setFormData({
        name: pendingData.parsed_name || '',
        category: pendingData.parsed_category || 'Other',
        price: pendingData.parsed_price || '',
        currency: pendingData.parsed_currency || 'EUR',
        billingCycle: pendingData.parsed_billing_cycle || 'monthly',
        paymentMethod: pendingData.parsed_payment_method || 'other',
        nextPayment: nextPaymentDate,
        color: '#3B82F6',
        reminder: 3,
        active: true,
        website: '',
        notes: `Erkannt aus: ${pendingData.original_filename}`
      })
    }
  }, [pendingData, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()

    const dataToSave = {
      ...formData,
      price: parseFloat(formData.price)
    }

    onConfirm(pendingData.id, dataToSave)
    onClose()
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value
    }))
  }

  const isLowConfidence = (fieldName) => lowConfidenceFields.includes(fieldName)

  const getInputClassName = (fieldName) => {
    const baseClass = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"

    if (isLowConfidence(fieldName)) {
      return `${baseClass} border-amber-300 dark:border-amber-500/50`
    }
    return `${baseClass} border-slate-200 dark:border-slate-700`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Rechnung bestätigen
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Überprüfe und korrigiere die erkannten Daten
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Low Confidence Warning */}
        {lowConfidenceFields.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Niedrige Erkennungs-Sicherheit
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-1">
                  Einige Felder wurden mit geringer Sicherheit erkannt. Bitte überprüfe die gelb markierten Felder.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Google Drive Link */}
        {pendingData?.google_drive_url && (
          <div className="mx-6 mt-4">
            <a
              href={pendingData.google_drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-purple-500 hover:text-purple-600"
            >
              <ExternalLink className="w-4 h-4" />
              Original-Dokument in Google Drive ansehen
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name des Abos *
              {isLowConfidence('name') && (
                <span className="text-xs text-amber-500">(Bitte prüfen)</span>
              )}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="z.B. Netflix, Spotify..."
              className={getInputClassName('name')}
            />
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Kategorie
              {isLowConfidence('category') && (
                <span className="text-xs text-amber-500">(Bitte prüfen)</span>
              )}
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={getInputClassName('category')}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Preis *
                {isLowConfidence('price') && (
                  <span className="text-xs text-amber-500">(Bitte prüfen)</span>
                )}
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                className={getInputClassName('price')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Währung
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className={getInputClassName('currency')}
              >
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Billing Cycle & Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Abrechnungszyklus
                {isLowConfidence('billingCycle') && (
                  <span className="text-xs text-amber-500">(Bitte prüfen)</span>
                )}
              </label>
              <select
                name="billingCycle"
                value={formData.billingCycle}
                onChange={handleChange}
                className={getInputClassName('billingCycle')}
              >
                {billingCycles.map(cycle => (
                  <option key={cycle.value} value={cycle.value}>{cycle.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Zahlungsart
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className={getInputClassName('paymentMethod')}
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Next Payment Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {formData.billingCycle === 'one_time' ? 'Zahlungsdatum *' : 'Nächste Zahlung *'}
              {isLowConfidence('nextPayment') && (
                <span className="text-xs text-amber-500">(Bitte prüfen)</span>
              )}
            </label>
            <input
              type="date"
              name="nextPayment"
              value={formData.nextPayment}
              onChange={handleChange}
              required
              className={getInputClassName('nextPayment')}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Farbe
            </label>
            <div className="flex flex-wrap gap-3">
              {defaultColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Reminder */}
          {formData.billingCycle !== 'one_time' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Erinnerung (Tage vorher)
              </label>
              <select
                name="reminder"
                value={formData.reminder}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={1}>1 Tag</option>
                <option value={3}>3 Tage</option>
                <option value={5}>5 Tage</option>
                <option value={7}>7 Tage</option>
                <option value={14}>14 Tage</option>
              </select>
            </div>
          )}

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Website (optional)
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notizen (optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              placeholder="Persönliche Notizen zum Abo..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">{formData.notes.length}/500 Zeichen</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-medium rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-green-500/25"
            >
              Abo erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConfirmSubscriptionModal
