import { useState, useEffect, useCallback } from 'react'
import {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getUpcomingPayments
} from '../services/subscriptionService'
import { supabase } from '../lib/supabase'

/**
 * Custom hook for managing subscriptions
 * @returns {Object} Subscriptions state and methods
 */
export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Transform database subscription to app format
  const transformSubscription = (dbSub) => {
    return {
      id: dbSub.id,
      name: dbSub.name,
      category: dbSub.category,
      price: parseFloat(dbSub.price),
      currency: dbSub.currency,
      billingCycle: dbSub.billing_cycle,
      paymentMethod: dbSub.payment_method || 'other',
      nextPayment: dbSub.next_payment_date,
      color: dbSub.color,
      reminder: dbSub.reminder_days,
      active: dbSub.is_active,
      website: dbSub.website,
      notes: dbSub.notes,
      createdAt: dbSub.created_at,
      updatedAt: dbSub.updated_at
    }
  }

  // Transform app subscription to database format
  const transformToDbFormat = (appSub) => {
    return {
      name: appSub.name,
      category: appSub.category,
      price: appSub.price,
      currency: appSub.currency,
      billingCycle: appSub.billingCycle,
      paymentMethod: appSub.paymentMethod || 'other',
      nextPayment: appSub.nextPayment,
      color: appSub.color,
      reminder: appSub.reminder,
      active: appSub.active ?? true,
      website: appSub.website,
      notes: appSub.notes
    }
  }

  // Check authentication status
  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
    return !!session
  }, [])

  // Fetch all subscriptions
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    setError(null)

    const isAuth = await checkAuth()
    if (!isAuth) {
      setLoading(false)
      setSubscriptions([])
      return
    }

    const { data, error: fetchError } = await getAllSubscriptions()

    if (fetchError) {
      setError(fetchError)
      setSubscriptions([])
    } else {
      const transformed = data.map(transformSubscription)
      setSubscriptions(transformed)
    }

    setLoading(false)
  }, [checkAuth])

  // Create a new subscription
  const addSubscription = useCallback(async (subscriptionData) => {
    setError(null)

    const dbData = transformToDbFormat(subscriptionData)
    const { data, error: createError } = await createSubscription(dbData)

    if (createError) {
      setError(createError)
      return { success: false, error: createError }
    }

    const transformed = transformSubscription(data)
    setSubscriptions(prev => [transformed, ...prev])

    return { success: true, data: transformed }
  }, [])

  // Update an existing subscription
  const editSubscription = useCallback(async (id, subscriptionData) => {
    setError(null)

    const dbData = transformToDbFormat(subscriptionData)
    const { data, error: updateError } = await updateSubscription(id, dbData)

    if (updateError) {
      setError(updateError)
      return { success: false, error: updateError }
    }

    const transformed = transformSubscription(data)
    setSubscriptions(prev =>
      prev.map(sub => sub.id === id ? transformed : sub)
    )

    return { success: true, data: transformed }
  }, [])

  // Delete a subscription
  const removeSubscription = useCallback(async (id) => {
    setError(null)

    const { error: deleteError } = await deleteSubscription(id)

    if (deleteError) {
      setError(deleteError)
      return { success: false, error: deleteError }
    }

    setSubscriptions(prev => prev.filter(sub => sub.id !== id))

    return { success: true }
  }, [])

  // Get subscription by ID
  const getSubscription = useCallback(async (id) => {
    setError(null)

    const { data, error: fetchError } = await getSubscriptionById(id)

    if (fetchError) {
      setError(fetchError)
      return { success: false, error: fetchError, data: null }
    }

    const transformed = transformSubscription(data)
    return { success: true, data: transformed }
  }, [])

  // Get upcoming payments
  const fetchUpcomingPayments = useCallback(async (days = 7) => {
    const { data, error: fetchError } = await getUpcomingPayments(days)

    if (fetchError) {
      return { success: false, error: fetchError, data: [] }
    }

    const transformed = data.map(transformSubscription)
    return { success: true, data: transformed }
  }, [])

  // Refresh subscriptions
  const refresh = useCallback(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  // Set up real-time subscription updates
  useEffect(() => {
    fetchSubscriptions()

    // Set up real-time listener
    const channel = supabase
      .channel('subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const transformed = transformSubscription(payload.new)
            setSubscriptions(prev => [transformed, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const transformed = transformSubscription(payload.new)
            setSubscriptions(prev =>
              prev.map(sub => sub.id === transformed.id ? transformed : sub)
            )
          } else if (payload.eventType === 'DELETE') {
            setSubscriptions(prev =>
              prev.filter(sub => sub.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup function
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchSubscriptions])

  return {
    subscriptions,
    loading,
    error,
    isAuthenticated,
    addSubscription,
    editSubscription,
    removeSubscription,
    getSubscription,
    fetchUpcomingPayments,
    refresh
  }
}

export default useSubscriptions
