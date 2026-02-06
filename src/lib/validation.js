/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - User input
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return ''

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .slice(0, 255) // Limit length
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * @param {string} password - Password
 * @returns {{valid: boolean, message: string}}
 */
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Passwort muss mindestens 6 Zeichen lang sein' }
  }

  if (password.length > 72) {
    return { valid: false, message: 'Passwort darf maximal 72 Zeichen lang sein' }
  }

  return { valid: true, message: '' }
}

/**
 * Validate subscription name
 * @param {string} name - Subscription name
 * @returns {{valid: boolean, message: string}}
 */
export const validateSubscriptionName = (name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Name ist erforderlich' }
  }

  if (name.length > 255) {
    return { valid: false, message: 'Name darf maximal 255 Zeichen lang sein' }
  }

  return { valid: true, message: '' }
}

/**
 * Validate price
 * @param {number|string} price - Price value
 * @returns {{valid: boolean, message: string}}
 */
export const validatePrice = (price) => {
  const numPrice = parseFloat(price)

  if (isNaN(numPrice)) {
    return { valid: false, message: 'Ungültiger Preis' }
  }

  if (numPrice < 0) {
    return { valid: false, message: 'Preis muss positiv sein' }
  }

  if (numPrice > 999999.99) {
    return { valid: false, message: 'Preis ist zu hoch' }
  }

  // Check for max 2 decimal places
  if (!/^\d+(\.\d{1,2})?$/.test(price.toString())) {
    return { valid: false, message: 'Maximal 2 Dezimalstellen erlaubt' }
  }

  return { valid: true, message: '' }
}

/**
 * Validate date
 * @param {string} dateString - Date string
 * @returns {{valid: boolean, message: string}}
 */
export const validateDate = (dateString) => {
  if (!dateString) {
    return { valid: false, message: 'Datum ist erforderlich' }
  }

  const date = new Date(dateString)

  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Ungültiges Datum' }
  }

  // Check if date is not too far in the past (more than 10 years)
  const tenYearsAgo = new Date()
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)

  if (date < tenYearsAgo) {
    return { valid: false, message: 'Datum liegt zu weit in der Vergangenheit' }
  }

  // Check if date is not too far in the future (more than 10 years)
  const tenYearsFromNow = new Date()
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10)

  if (date > tenYearsFromNow) {
    return { valid: false, message: 'Datum liegt zu weit in der Zukunft' }
  }

  return { valid: true, message: '' }
}

/**
 * Validate hex color
 * @param {string} color - Hex color code
 * @returns {{valid: boolean, message: string}}
 */
export const validateColor = (color) => {
  const hexRegex = /^#[0-9A-F]{6}$/i

  if (!hexRegex.test(color)) {
    return { valid: false, message: 'Ungültige Farbe (Format: #RRGGBB)' }
  }

  return { valid: true, message: '' }
}

/**
 * Validate subscription data
 * @param {Object} subscription - Subscription object
 * @returns {{valid: boolean, errors: Object}}
 */
export const validateSubscription = (subscription) => {
  const errors = {}

  const nameValidation = validateSubscriptionName(subscription.name)
  if (!nameValidation.valid) {
    errors.name = nameValidation.message
  }

  const priceValidation = validatePrice(subscription.price)
  if (!priceValidation.valid) {
    errors.price = priceValidation.message
  }

  const dateValidation = validateDate(subscription.nextPayment)
  if (!dateValidation.valid) {
    errors.nextPayment = dateValidation.message
  }

  if (subscription.color) {
    const colorValidation = validateColor(subscription.color)
    if (!colorValidation.valid) {
      errors.color = colorValidation.message
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Sanitize error messages to prevent leaking sensitive information
 * @param {Error} error - Error object
 * @returns {string} Safe error message
 */
export const sanitizeErrorMessage = (error) => {
  // Generic messages for common database errors
  const safeMessages = {
    '23505': 'Dieser Eintrag existiert bereits',
    '23503': 'Ungültige Referenz',
    '23502': 'Pflichtfeld fehlt',
    '23514': 'Ungültiger Wert',
    'PGRST116': 'Keine Berechtigung',
    'PGRST301': 'Nicht gefunden',
  }

  const errorMessage = error?.message || ''

  // Check for known error codes
  for (const [code, message] of Object.entries(safeMessages)) {
    if (errorMessage.includes(code)) {
      return message
    }
  }

  // Check for common auth errors
  if (errorMessage.toLowerCase().includes('invalid login')) {
    return 'Ungültige Anmeldedaten'
  }
  if (errorMessage.toLowerCase().includes('email not confirmed')) {
    return 'E-Mail noch nicht bestätigt'
  }
  if (errorMessage.toLowerCase().includes('already registered')) {
    return 'E-Mail bereits registriert'
  }

  // Generic fallback
  return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
}
