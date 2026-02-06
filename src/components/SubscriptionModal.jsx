import React, { useState, useEffect } from 'react'
import { X, Globe } from 'lucide-react'
import { categories, currencies, billingCycles, paymentMethods } from '../data/sampleData'

const defaultColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16'
]

function SubscriptionModal({ isOpen, onClose, onSave, subscription = null }) {
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

  useEffect(() => {
    if (subscription) {
      setFormData({
        ...subscription,
        nextPayment: subscription.nextPayment || '',
        website: subscription.website || '',
        notes: subscription.notes || '',
        paymentMethod: subscription.paymentMethod || 'other'
      })
    } else {
      setFormData({
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
    }
  }, [subscription, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()

    const dataToSave = {
      ...formData,
      id: subscription?.id || Date.now(),
      price: parseFloat(formData.price)
    }

    onSave(dataToSave)
    onClose()
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {subscription ? 'Abo bearbeiten' : 'Neues Abo hinzufügen'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name des Abos *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="z.B. Netflix, Spotify..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Kategorie
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Preis *
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Abrechnungszyklus
              </label>
              <select
                name="billingCycle"
                value={formData.billingCycle}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {formData.billingCycle === 'one_time' ? 'Zahlungsdatum *' : 'Nächste Zahlung *'}
            </label>
            <input
              type="date"
              name="nextPayment"
              value={formData.nextPayment}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {formData.billingCycle === 'one_time' && (
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Wann wurde die Zahlung getätigt?</p>
            )}
          </div>

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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Website (optional)
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-500" />
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

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
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{formData.notes.length}/500 Zeichen</p>
          </div>

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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-500/25"
            >
              {subscription ? 'Speichern' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubscriptionModal
