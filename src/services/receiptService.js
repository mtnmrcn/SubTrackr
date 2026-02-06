import { supabase } from '../lib/supabase'

/**
 * Upload a receipt file to Supabase Storage
 * @param {File} file - The file to upload
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const uploadReceipt = async (file) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop().toLowerCase()
    const fileName = `${timestamp}-${file.name}`
    const filePath = `${user.id}/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    return {
      data: {
        path: data.path,
        fileName: file.name,
        fileType: fileExt,
        userId: user.id
      },
      error: null
    }
  } catch (error) {
    console.error('Error uploading receipt:', error)
    return { data: null, error }
  }
}

/**
 * Create a pending subscription entry in the database
 * @param {Object} data - The pending subscription data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createPendingSubscription = async (data) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data: pending, error } = await supabase
      .from('pending_subscriptions')
      .insert([{
        user_id: user.id,
        original_filename: data.fileName,
        file_type: data.fileType,
        status: 'uploading'
      }])
      .select()
      .single()

    if (error) throw error

    return { data: pending, error: null }
  } catch (error) {
    console.error('Error creating pending subscription:', error)
    return { data: null, error }
  }
}

/**
 * Trigger n8n webhook for receipt processing
 * @param {Object} params - Processing parameters
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const triggerReceiptProcessing = async ({ filePath, userId, fileName, fileType, pendingId }) => {
  try {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL
    const apiKey = import.meta.env.VITE_N8N_API_KEY

    if (!webhookUrl) {
      throw new Error('n8n Webhook URL not configured')
    }

    // Update status to processing
    await supabase
      .from('pending_subscriptions')
      .update({ status: 'processing' })
      .eq('id', pendingId)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey || ''
        },
        body: JSON.stringify({
          file_path: filePath,
          user_id: userId,
          filename: fileName,
          file_type: fileType,
          pending_id: pendingId
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Webhook failed (${response.status}): ${errorText}`)
      }

      const result = await response.json()

      // Check if n8n returned an error
      if (result.success === false) {
        throw new Error(result.error || 'n8n processing failed')
      }

      return { data: result, error: null }
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        throw new Error('Webhook timeout - n8n antwortet nicht')
      }
      throw fetchError
    }
  } catch (error) {
    console.error('Error triggering receipt processing:', error)

    // Update status to error
    await supabase
      .from('pending_subscriptions')
      .update({
        status: 'error',
        error_message: error.message
      })
      .eq('id', pendingId)

    return { data: null, error }
  }
}

/**
 * Get all pending subscriptions for the current user
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const getPendingSubscriptions = async () => {
  try {
    const { data, error } = await supabase
      .from('pending_subscriptions')
      .select('*')
      .in('status', ['pending', 'processing', 'uploading', 'error'])
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching pending subscriptions:', error)
    return { data: [], error }
  }
}

/**
 * Get a single pending subscription by ID
 * @param {string} id - Pending subscription UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getPendingSubscriptionById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('pending_subscriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching pending subscription:', error)
    return { data: null, error }
  }
}

/**
 * Confirm a pending subscription and create actual subscription
 * @param {string} pendingId - Pending subscription UUID
 * @param {Object} subscriptionData - Final subscription data (possibly edited by user)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const confirmPendingSubscription = async (pendingId, subscriptionData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Create the actual subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: user.id,
        name: subscriptionData.name,
        category: subscriptionData.category || 'Other',
        price: subscriptionData.price,
        currency: subscriptionData.currency || 'EUR',
        billing_cycle: subscriptionData.billingCycle || 'monthly',
        payment_method: subscriptionData.paymentMethod || 'other',
        next_payment_date: subscriptionData.nextPayment,
        color: subscriptionData.color || '#3B82F6',
        reminder_days: subscriptionData.reminder || 3,
        is_active: true,
        website: subscriptionData.website || null,
        notes: subscriptionData.notes || null
      }])
      .select()
      .single()

    if (subError) throw subError

    // Update pending subscription status
    const { error: updateError } = await supabase
      .from('pending_subscriptions')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', pendingId)

    if (updateError) {
      console.error('Warning: Could not update pending status:', updateError)
    }

    return { data: subscription, error: null }
  } catch (error) {
    console.error('Error confirming pending subscription:', error)
    return { data: null, error }
  }
}

/**
 * Reject/delete a pending subscription
 * @param {string} pendingId - Pending subscription UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const rejectPendingSubscription = async (pendingId) => {
  try {
    const { data, error } = await supabase
      .from('pending_subscriptions')
      .update({ status: 'rejected' })
      .eq('id', pendingId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error rejecting pending subscription:', error)
    return { data: null, error }
  }
}

/**
 * Delete a pending subscription permanently
 * @param {string} pendingId - Pending subscription UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const deletePendingSubscription = async (pendingId) => {
  try {
    const { data, error } = await supabase
      .from('pending_subscriptions')
      .delete()
      .eq('id', pendingId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error deleting pending subscription:', error)
    return { data: null, error }
  }
}

/**
 * Update a pending subscription with parsed data (called by n8n or for manual updates)
 * @param {string} pendingId - Pending subscription UUID
 * @param {Object} parsedData - Parsed data from OCR/GPT
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updatePendingWithParsedData = async (pendingId, parsedData) => {
  try {
    const { data, error } = await supabase
      .from('pending_subscriptions')
      .update({
        raw_ocr_text: parsedData.rawText,
        parsed_name: parsedData.name,
        parsed_price: parsedData.price,
        parsed_currency: parsedData.currency,
        parsed_billing_cycle: parsedData.billingCycle,
        parsed_next_payment: parsedData.nextPayment,
        parsed_category: parsedData.category,
        confidence_score: parsedData.confidence,
        google_drive_url: parsedData.googleDriveUrl,
        google_drive_file_id: parsedData.googleDriveFileId,
        status: 'pending',
        processed_at: new Date().toISOString()
      })
      .eq('id', pendingId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating pending subscription:', error)
    return { data: null, error }
  }
}

/**
 * Get signed URL for viewing a receipt file
 * @param {string} filePath - File path in storage
 * @returns {Promise<{data: string|null, error: Error|null}>}
 */
export const getReceiptUrl = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(filePath, 3600) // 1 hour

    if (error) throw error

    return { data: data.signedUrl, error: null }
  } catch (error) {
    console.error('Error getting receipt URL:', error)
    return { data: null, error }
  }
}
