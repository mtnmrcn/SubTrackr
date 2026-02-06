import { supabase } from '../lib/supabase'

/**
 * Get all subscriptions for the current user
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const getAllSubscriptions = async () => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return { data: [], error }
  }
}

/**
 * Get a single subscription by ID
 * @param {string} id - Subscription UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getSubscriptionById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return { data: null, error }
  }
}

/**
 * Create a new subscription
 * @param {Object} subscriptionData - Subscription data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createSubscription = async (subscriptionData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: user.id,
        name: subscriptionData.name,
        category: subscriptionData.category,
        price: subscriptionData.price,
        currency: subscriptionData.currency,
        billing_cycle: subscriptionData.billingCycle,
        payment_method: subscriptionData.paymentMethod || 'other',
        next_payment_date: subscriptionData.nextPayment,
        color: subscriptionData.color,
        reminder_days: subscriptionData.reminder,
        is_active: subscriptionData.active ?? true,
        website: subscriptionData.website || null,
        notes: subscriptionData.notes || null
      }])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating subscription:', error)
    return { data: null, error }
  }
}

/**
 * Update an existing subscription
 * @param {string} id - Subscription UUID
 * @param {Object} subscriptionData - Updated subscription data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateSubscription = async (id, subscriptionData) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        name: subscriptionData.name,
        category: subscriptionData.category,
        price: subscriptionData.price,
        currency: subscriptionData.currency,
        billing_cycle: subscriptionData.billingCycle,
        payment_method: subscriptionData.paymentMethod || 'other',
        next_payment_date: subscriptionData.nextPayment,
        color: subscriptionData.color,
        reminder_days: subscriptionData.reminder,
        is_active: subscriptionData.active ?? true,
        website: subscriptionData.website || null,
        notes: subscriptionData.notes || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating subscription:', error)
    return { data: null, error }
  }
}

/**
 * Delete a subscription
 * @param {string} id - Subscription UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const deleteSubscription = async (id) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return { data: null, error }
  }
}

/**
 * Get upcoming payments within specified days
 * @param {number} days - Number of days to look ahead (default: 7)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const getUpcomingPayments = async (days = 7) => {
  try {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true)
      .gte('next_payment_date', today.toISOString().split('T')[0])
      .lte('next_payment_date', futureDate.toISOString().split('T')[0])
      .order('next_payment_date', { ascending: true })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching upcoming payments:', error)
    return { data: [], error }
  }
}

/**
 * Toggle subscription active status
 * @param {string} id - Subscription UUID
 * @param {boolean} isActive - New active status
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const toggleSubscriptionStatus = async (id, isActive) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error toggling subscription status:', error)
    return { data: null, error }
  }
}

/**
 * Get subscriptions grouped by category
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const getSubscriptionsByCategory = async () => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (error) throw error

    // Group by category
    const grouped = (data || []).reduce((acc, sub) => {
      const category = sub.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(sub)
      return acc
    }, {})

    return { data: grouped, error: null }
  } catch (error) {
    console.error('Error fetching subscriptions by category:', error)
    return { data: {}, error }
  }
}
