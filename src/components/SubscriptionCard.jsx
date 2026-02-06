import React, { useState } from 'react'
import { Calendar, Edit, Trash2, Tag, ExternalLink, CreditCard, Wallet, Building2, Building, HelpCircle, Pause, Play, MoreHorizontal } from 'lucide-react'
import { paymentMethods } from '../data/sampleData'

function SubscriptionCard({ subscription, onEdit, onDelete, onToggleActive }) {
  const [showActions, setShowActions] = useState(false)

  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysUntilPayment = (dateString) => {
    const today = new Date()
    const paymentDate = new Date(dateString)
    const diffTime = paymentDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntil = getDaysUntilPayment(subscription.nextPayment)
  const isUpcoming = daysUntil <= 7 && daysUntil >= 0

  const getBillingCycleLabel = (cycle) => {
    switch(cycle) {
      case 'monthly': return 'mtl.'
      case 'quarterly': return 'qtl.'
      case 'yearly': return 'jährl.'
      default: return 'mtl.'
    }
  }

  const getBillingCycleText = (cycle) => {
    switch(cycle) {
      case 'monthly': return 'Monatlich'
      case 'quarterly': return 'Vierteljährlich'
      case 'yearly': return 'Jährlich'
      case 'one_time': return 'Einmalig'
      default: return 'Monatlich'
    }
  }

  const isOneTime = subscription.billingCycle === 'one_time'

  const getPaymentMethodIcon = (method) => {
    const iconMap = {
      paypal: Wallet,
      credit_card: CreditCard,
      sepa: Building2,
      bank_transfer: Building,
      other: HelpCircle
    }
    return iconMap[method] || HelpCircle
  }

  const getPaymentMethodLabel = (method) => {
    const methodObj = paymentMethods.find(m => m.value === method)
    return methodObj ? methodObj.label : 'Sonstige'
  }

  const isPaused = !subscription.active

  return (
    <div
      className={`card-hover glass-card bg-white/80 dark:bg-slate-800/50 rounded-2xl border ${
        isPaused
          ? 'border-slate-200 dark:border-slate-700/30 opacity-60'
          : isUpcoming
          ? 'border-amber-200 dark:border-amber-500/30'
          : 'border-slate-100 dark:border-slate-700/50'
      } shadow-sm overflow-hidden group`}
    >
      <div className="flex items-center p-5 gap-5">
        {/* Logo/Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg"
          style={{
            backgroundColor: subscription.color,
            boxShadow: `0 8px 20px -8px ${subscription.color}60`
          }}
        >
          {subscription.name.charAt(0).toUpperCase()}
        </div>

        {/* Content - Left Side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white truncate">
              {subscription.name}
            </h3>
            {isPaused && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-full">
                Pausiert
              </span>
            )}
            {isUpcoming && !isOneTime && !isPaused && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full">
                In {daysUntil} {daysUntil === 1 ? 'Tag' : 'Tagen'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full">
              <Tag className="w-3 h-3" />
              {subscription.category}
            </span>

            {/* Billing Cycle */}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {getBillingCycleText(subscription.billingCycle)}
            </span>

            {/* Payment Method */}
            {subscription.paymentMethod && subscription.paymentMethod !== 'other' && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                {React.createElement(getPaymentMethodIcon(subscription.paymentMethod), { className: 'w-3 h-3' })}
                {getPaymentMethodLabel(subscription.paymentMethod)}
              </span>
            )}
          </div>
        </div>

        {/* Right Side - Price & Date */}
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {formatPrice(subscription.price, subscription.currency)}
          </div>
          {!isOneTime && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              pro {getBillingCycleLabel(subscription.billingCycle) === 'mtl.' ? 'Monat' : getBillingCycleLabel(subscription.billingCycle) === 'qtl.' ? 'Quartal' : 'Jahr'}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400 justify-end">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(subscription.nextPayment)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 border-l border-slate-100 dark:border-slate-700/50">
          <button
            onClick={() => onToggleActive(subscription.id, subscription.active)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
            title={isPaused ? "Fortsetzen" : "Pausieren"}
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-green-500" />
            ) : (
              <Pause className="w-4 h-4 text-amber-500" />
            )}
          </button>
          <button
            onClick={() => onEdit(subscription)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
            title="Bearbeiten"
          >
            <Edit className="w-4 h-4 text-blue-500" />
          </button>
          <button
            onClick={() => onDelete(subscription.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
            title="Löschen"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Website & Notes Row */}
      {(subscription.website || subscription.notes) && (
        <div className="px-5 pb-4 pt-0 flex flex-wrap items-center gap-3 border-t border-slate-50 dark:border-slate-700/30 mt-0">
          {subscription.website && (
            <a
              href={subscription.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors mt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
              Website
            </a>
          )}
          {subscription.notes && (
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-md mt-3">
              {subscription.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default SubscriptionCard
