/**
 * Currency conversion utilities
 *
 * Uses fixed exchange rates for now.
 * TODO: For production, consider using a live API like:
 * - exchangerate-api.com (free tier: 1500 requests/month)
 * - fixer.io
 * - openexchangerates.org
 */

// Fixed exchange rates (base: EUR)
const EXCHANGE_RATES = {
  EUR: 1.0,
  USD: 0.92,    // 1 USD = 0.92 EUR
  GBP: 1.17,    // 1 GBP = 1.17 EUR
  CHF: 1.05,    // 1 CHF = 1.05 EUR
  JPY: 0.0062,  // 1 JPY = 0.0062 EUR
  CAD: 0.66,    // 1 CAD = 0.66 EUR
  AUD: 0.60,    // 1 AUD = 0.60 EUR
}

/**
 * Convert any currency amount to EUR
 * @param {number} amount - The amount to convert
 * @param {string} currency - Currency code (EUR, USD, GBP, etc.)
 * @returns {number} Amount in EUR
 */
export const convertToEUR = (amount, currency = 'EUR') => {
  const rate = EXCHANGE_RATES[currency] || 1.0
  return amount * rate
}

/**
 * Format currency with proper locale and symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Get exchange rate for a currency
 * @param {string} currency - Currency code
 * @returns {number} Exchange rate to EUR
 */
export const getExchangeRate = (currency = 'EUR') => {
  return EXCHANGE_RATES[currency] || 1.0
}

/**
 * Get all supported currencies
 * @returns {string[]} Array of currency codes
 */
export const getSupportedCurrencies = () => {
  return Object.keys(EXCHANGE_RATES)
}
