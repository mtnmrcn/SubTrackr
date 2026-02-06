import { supabase } from '../lib/supabase'

/**
 * Get profile for a user
 * @param {string} userId - User UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return { data: null, error }
  }
}

/**
 * Update user profile
 * @param {string} userId - User UUID
 * @param {Object} profileData - Profile data to update
 * @param {string} [profileData.display_name] - Display name
 * @param {string} [profileData.default_currency] - Default currency (EUR, USD, GBP)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateProfile = async (userId, profileData) => {
  try {
    const updateData = {}

    if (profileData.display_name !== undefined) {
      updateData.display_name = profileData.display_name
    }

    if (profileData.default_currency !== undefined) {
      updateData.default_currency = profileData.default_currency
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { data: null, error }
  }
}

/**
 * Create profile for a user (used if trigger didn't fire)
 * @param {string} userId - User UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const createProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id: userId }])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating profile:', error)
    return { data: null, error }
  }
}

/**
 * Get or create profile (ensures profile exists)
 * @param {string} userId - User UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getOrCreateProfile = async (userId) => {
  const { data, error } = await getProfile(userId)

  if (data) {
    return { data, error: null }
  }

  // Profile doesn't exist, create it
  return await createProfile(userId)
}
