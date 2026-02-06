import React from 'react'

function StatsCard({ icon: Icon, label, value, subtitle, trend, color = 'purple' }) {
  const colorStyles = {
    purple: {
      iconBg: 'bg-purple-100 dark:bg-purple-500/20',
      iconColor: 'text-purple-500 dark:text-purple-400',
      accent: 'from-purple-500 to-pink-500'
    },
    teal: {
      iconBg: 'bg-teal-100 dark:bg-teal-500/20',
      iconColor: 'text-teal-500 dark:text-teal-400',
      accent: 'from-teal-500 to-cyan-500'
    },
    pink: {
      iconBg: 'bg-pink-100 dark:bg-pink-500/20',
      iconColor: 'text-pink-500 dark:text-pink-400',
      accent: 'from-pink-500 to-rose-500'
    },
    blue: {
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-500 dark:text-blue-400',
      accent: 'from-blue-500 to-indigo-500'
    },
    amber: {
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      iconColor: 'text-amber-500 dark:text-amber-400',
      accent: 'from-amber-500 to-orange-500'
    }
  }

  const style = colorStyles[color] || colorStyles.purple

  return (
    <div className="glass-card card-hover bg-white/70 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div className={`w-12 h-12 ${style.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${style.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Trend */}
        {trend && (
          <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
            trend.positive
              ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
          }`}>
            {trend.value}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsCard
