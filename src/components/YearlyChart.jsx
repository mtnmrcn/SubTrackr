import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { getMonthlyChartData } from '../lib/export'
import { useTheme } from '../context/ThemeContext'

function YearlyChart({ subscriptions }) {
  const { theme } = useTheme()
  const data = getMonthlyChartData(subscriptions)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-900 dark:text-white font-medium">
            Erwartete Zahlungen im {payload[0].payload.month}
          </p>
          <p className="text-purple-400 text-sm font-semibold">
            {payload[0].value.toFixed(2)} EUR
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-xs">
            {payload[0].payload.abos} aktive Abos
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-200 dark:border-slate-700/50">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-purple-400" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          Cashflow-Übersicht (Nächste 12 Monate)
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === 'dark' ? '#334155' : '#e2e8f0'}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
            tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
            axisLine={{ stroke: theme === 'dark' ? '#475569' : '#cbd5e1' }}
          />
          <YAxis
            stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
            tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
            axisLine={{ stroke: theme === 'dark' ? '#475569' : '#cbd5e1' }}
            tickFormatter={(value) => `${value}€`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
          />
          <Bar
            dataKey="kosten"
            fill="#8b5cf6"
            radius={[8, 8, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default YearlyChart
