export const sampleSubscriptions = [
  {
    id: 1,
    name: 'Claude Pro',
    category: 'AI',
    price: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    nextPayment: '2025-01-15',
    color: '#D97706',
    reminder: 3,
    active: true
  },
  {
    id: 2,
    name: 'ChatGPT Plus',
    category: 'AI',
    price: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    nextPayment: '2025-01-08',
    color: '#10B981',
    reminder: 3,
    active: true
  },
  {
    id: 3,
    name: 'Hostinger',
    category: 'Hosting',
    price: 89.99,
    currency: 'EUR',
    billingCycle: 'yearly',
    nextPayment: '2025-06-12',
    color: '#8B5CF6',
    reminder: 7,
    active: true
  },
  {
    id: 4,
    name: 'Netflix',
    category: 'Entertainment',
    price: 17.99,
    currency: 'EUR',
    billingCycle: 'monthly',
    nextPayment: '2025-01-05',
    color: '#EF4444',
    reminder: 3,
    active: true
  },
  {
    id: 5,
    name: 'Spotify Premium',
    category: 'Entertainment',
    price: 10.99,
    currency: 'EUR',
    billingCycle: 'monthly',
    nextPayment: '2025-01-20',
    color: '#22C55E',
    reminder: 3,
    active: true
  },
  {
    id: 6,
    name: 'GitHub Pro',
    category: 'Development',
    price: 4,
    currency: 'USD',
    billingCycle: 'monthly',
    nextPayment: '2025-01-10',
    color: '#6366F1',
    reminder: 3,
    active: true
  },
  {
    id: 7,
    name: 'Adobe Creative Cloud',
    category: 'Design',
    price: 59.99,
    currency: 'EUR',
    billingCycle: 'monthly',
    nextPayment: '2025-01-18',
    color: '#DC2626',
    reminder: 5,
    active: true
  },
  {
    id: 8,
    name: 'Notion Plus',
    category: 'Productivity',
    price: 8,
    currency: 'USD',
    billingCycle: 'monthly',
    nextPayment: '2025-01-25',
    color: '#3B82F6',
    reminder: 3,
    active: true
  }
]

export const categories = [
  'AI',
  'Hosting',
  'Entertainment',
  'Development',
  'Design',
  'Productivity',
  'Cloud Storage',
  'Security',
  'Other'
]

export const currencies = ['EUR', 'USD', 'GBP', 'CHF']

export const billingCycles = [
  { value: 'monthly', label: 'Monatlich' },
  { value: 'quarterly', label: 'Alle 3 Monate' },
  { value: 'yearly', label: 'Jährlich' },
  { value: 'one_time', label: 'Einmalig' }
]

export const paymentMethods = [
  { value: 'paypal', label: 'PayPal', icon: 'Wallet' },
  { value: 'credit_card', label: 'Kreditkarte', icon: 'CreditCard' },
  { value: 'sepa', label: 'Bankeinzug/SEPA', icon: 'Building2' },
  { value: 'bank_transfer', label: 'Überweisung', icon: 'Building' },
  { value: 'other', label: 'Sonstige', icon: 'HelpCircle' }
]
