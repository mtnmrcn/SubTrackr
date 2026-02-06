/**
 * Export utilities for subscriptions
 */

import { convertToEUR } from './currency'

/**
 * Export subscriptions to CSV
 * @param {Array} subscriptions - Array of subscriptions
 */
export const exportToCSV = (subscriptions) => {
  if (!subscriptions || subscriptions.length === 0) {
    throw new Error('Keine Abonnements zum Exportieren')
  }

  // CSV Headers
  const headers = [
    'Name',
    'Kategorie',
    'Preis',
    'Währung',
    'Zyklus',
    'Nächste Zahlung',
    'Erinnerung (Tage)',
    'Aktiv',
    'Website',
    'Notizen',
    'Erstellt am'
  ]

  // Convert data to CSV rows
  const rows = subscriptions.map(sub => [
    `"${sub.name || ''}"`,
    `"${sub.category || ''}"`,
    sub.price || 0,
    sub.currency || 'EUR',
    sub.billingCycle === 'monthly' ? 'Monatlich' : 'Jährlich',
    sub.nextPayment || '',
    sub.reminder || 3,
    sub.active ? 'Ja' : 'Nein',
    `"${sub.website || ''}"`,
    `"${(sub.notes || '').replace(/"/g, '""')}"`, // Escape quotes
    sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('de-DE') : ''
  ])

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `subtrackr-export-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Calculate monthly costs for chart - Cashflow view
 * Shows actual expected payments for the next 12 months from today
 * @param {Array} subscriptions - Array of subscriptions
 * @returns {Array} Monthly cost data for chart
 */
export const getMonthlyChartData = (subscriptions) => {
  const months = [
    'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
  ]

  const today = new Date()
  const currentMonth = today.getMonth() // 0-11
  const currentYear = today.getFullYear()

  // Initialize data for next 12 months
  const monthlyData = []
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth + i) % 12
    const year = currentYear + Math.floor((currentMonth + i) / 12)
    monthlyData.push({
      month: months[monthIndex],
      monthIndex: monthIndex,
      year: year,
      kosten: 0,
      abos: 0
    })
  }

  subscriptions.forEach(sub => {
    if (!sub.active || !sub.nextPayment) return

    const priceInEUR = convertToEUR(sub.price, sub.currency)
    const nextPaymentDate = new Date(sub.nextPayment)
    const paymentYear = nextPaymentDate.getFullYear()
    const paymentMonth = nextPaymentDate.getMonth() // 0-11

    if (sub.billingCycle === 'monthly') {
      // Monthly subscriptions: Add to all months from first payment onwards
      monthlyData.forEach((data) => {
        const dataDate = new Date(data.year, data.monthIndex, 1)
        const firstPaymentDate = new Date(paymentYear, paymentMonth, 1)

        // Only add if this month is >= first payment month
        if (dataDate >= firstPaymentDate) {
          data.kosten += priceInEUR
        }
      })
    } else if (sub.billingCycle === 'quarterly') {
      // Quarterly subscriptions: Add to payment month and every 3 months after
      monthlyData.forEach((data) => {
        const dataDate = new Date(data.year, data.monthIndex, 1)
        const firstPaymentDate = new Date(paymentYear, paymentMonth, 1)

        // Calculate months difference
        const monthsDiff = (data.year - paymentYear) * 12 + (data.monthIndex - paymentMonth)

        // Add if this is a payment month (every 3 months starting from first payment)
        if (monthsDiff >= 0 && monthsDiff % 3 === 0) {
          data.kosten += priceInEUR
        }
      })
    } else if (sub.billingCycle === 'yearly') {
      // Yearly subscriptions: Add full amount only to the payment month
      monthlyData.forEach((data) => {
        if (data.year === paymentYear && data.monthIndex === paymentMonth) {
          data.kosten += priceInEUR
        }
      })
    } else if (sub.billingCycle === 'one_time') {
      // One-time payments: Add to the payment month only
      monthlyData.forEach((data) => {
        if (data.year === paymentYear && data.monthIndex === paymentMonth) {
          data.kosten += priceInEUR
        }
      })
    }
  })

  // Count active subscriptions for each month
  const activeCount = subscriptions.filter(s => s.active).length

  return monthlyData.map(data => ({
    month: data.month,
    kosten: Math.round(data.kosten * 100) / 100,
    abos: activeCount
  }))
}
