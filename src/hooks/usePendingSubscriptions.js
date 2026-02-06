import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  getPendingSubscriptions,
  confirmPendingSubscription,
  rejectPendingSubscription,
  deletePendingSubscription,
  uploadReceipt,
  createPendingSubscription,
  triggerReceiptProcessing
} from '../services/receiptService'

/**
 * Hook for managing pending subscriptions (receipt scanner)
 */
export const usePendingSubscriptions = () => {
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Fetch pending subscriptions
  const fetchPending = useCallback(async () => {
    if (!user) {
      setPending([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await getPendingSubscriptions()

      if (fetchError) throw fetchError

      setPending(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching pending subscriptions:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Initial fetch
  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  // Real-time subscription for updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('pending_subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPending(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setPending(prev =>
              prev.map(item =>
                item.id === payload.new.id ? payload.new : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setPending(prev =>
              prev.filter(item => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  /**
   * Upload and process a receipt file
   * @param {File} file - The file to upload
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  const uploadAndProcessReceipt = async (file) => {
    if (!user) {
      return { success: false, error: new Error('Not authenticated') }
    }

    try {
      setUploading(true)

      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Ungültiger Dateityp. Erlaubt: PDF, JPG, PNG, WEBP')
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('Datei zu groß. Maximum: 10MB')
      }

      // Create pending entry first
      const { data: pendingEntry, error: pendingError } = await createPendingSubscription({
        fileName: file.name,
        fileType: file.name.split('.').pop().toLowerCase()
      })

      if (pendingError) throw pendingError

      // Upload file
      const { data: uploadData, error: uploadError } = await uploadReceipt(file)

      if (uploadError) {
        // Delete pending entry on upload failure
        await deletePendingSubscription(pendingEntry.id)
        throw uploadError
      }

      // Trigger n8n processing
      const { error: processError } = await triggerReceiptProcessing({
        filePath: uploadData.path,
        userId: uploadData.userId,
        fileName: uploadData.fileName,
        fileType: uploadData.fileType,
        pendingId: pendingEntry.id
      })

      if (processError) {
        console.error('Processing trigger failed:', processError)
        // Don't throw - the pending entry is already created with error status
      }

      return { success: true }
    } catch (err) {
      console.error('Error uploading receipt:', err)
      return { success: false, error: err }
    } finally {
      setUploading(false)
    }
  }

  /**
   * Confirm a pending subscription
   * @param {string} pendingId - Pending subscription UUID
   * @param {Object} subscriptionData - Final subscription data
   * @returns {Promise<{success: boolean, data?: Object, error?: Error}>}
   */
  const confirmPending = async (pendingId, subscriptionData) => {
    try {
      const { data, error: confirmError } = await confirmPendingSubscription(
        pendingId,
        subscriptionData
      )

      if (confirmError) throw confirmError

      // Remove from local state (will also update via realtime)
      setPending(prev => prev.filter(item => item.id !== pendingId))

      return { success: true, data }
    } catch (err) {
      console.error('Error confirming pending subscription:', err)
      return { success: false, error: err }
    }
  }

  /**
   * Reject a pending subscription
   * @param {string} pendingId - Pending subscription UUID
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  const rejectPending = async (pendingId) => {
    try {
      const { error: rejectError } = await rejectPendingSubscription(pendingId)

      if (rejectError) throw rejectError

      // Remove from local state
      setPending(prev => prev.filter(item => item.id !== pendingId))

      return { success: true }
    } catch (err) {
      console.error('Error rejecting pending subscription:', err)
      return { success: false, error: err }
    }
  }

  /**
   * Delete a pending subscription permanently
   * @param {string} pendingId - Pending subscription UUID
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  const deletePending = async (pendingId) => {
    try {
      const { error: deleteError } = await deletePendingSubscription(pendingId)

      if (deleteError) throw deleteError

      // Remove from local state
      setPending(prev => prev.filter(item => item.id !== pendingId))

      return { success: true }
    } catch (err) {
      console.error('Error deleting pending subscription:', err)
      return { success: false, error: err }
    }
  }

  /**
   * Retry processing a failed pending subscription
   * @param {Object} pendingItem - The pending subscription item
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  const retryProcessing = async (pendingItem) => {
    try {
      // Update status back to processing
      await supabase
        .from('pending_subscriptions')
        .update({ status: 'processing', error_message: null })
        .eq('id', pendingItem.id)

      // Re-trigger n8n (would need the original file path)
      // For now, this is a placeholder - in production you'd need to store the file path

      return { success: true }
    } catch (err) {
      console.error('Error retrying processing:', err)
      return { success: false, error: err }
    }
  }

  // Get counts for different statuses
  const counts = {
    total: pending.length,
    pending: pending.filter(p => p.status === 'pending').length,
    processing: pending.filter(p => p.status === 'processing' || p.status === 'uploading').length,
    error: pending.filter(p => p.status === 'error').length
  }

  return {
    pending,
    loading,
    error,
    uploading,
    counts,
    uploadAndProcessReceipt,
    confirmPending,
    rejectPending,
    deletePending,
    retryProcessing,
    refresh: fetchPending
  }
}

export default usePendingSubscriptions
