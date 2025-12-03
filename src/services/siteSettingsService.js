import { supabase, handleSupabaseError } from '../lib/supabase'

/**
 * Get all site settings
 */
export const getSiteSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')

    if (error) throw error

    // Transform array into object with keys
    const settings = {}
    data.forEach(setting => {
      settings[setting.key] = setting.value
    })

    return { data: settings, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Get a specific site setting by key
 */
export const getSiteSetting = async (key) => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error) throw error
    return { data: data?.value || null, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Update a site setting (admin only)
 */
export const updateSiteSetting = async (key, value) => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ key, value }, { onConflict: 'key' })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

