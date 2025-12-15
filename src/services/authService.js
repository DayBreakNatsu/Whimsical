import { supabase, handleSupabaseError } from '../lib/supabase'

// Allow a safe local development bypass when Supabase is unavailable.
// Enable by setting VITE_DEV_AUTH_BYPASS=true in your .env for local development only.
const DEV_BYPASS = Boolean(import.meta.env.VITE_DEV_AUTH_BYPASS === 'true');
const DEV_ADMIN_PASSWORD = import.meta.env.VITE_DEV_ADMIN_PASSWORD || 'Achlys2025!';

/**
 * Sign up with email and password
 */
export const signUp = async (email, password, metadata = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata, // Additional user metadata (name, etc.)
      },
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    // If Supabase is failing and dev bypass is enabled, allow a local mock signin for development.
    const handled = handleSupabaseError(error)
    if (DEV_BYPASS && (typeof window !== 'undefined') && (window.location.hostname === 'localhost' || import.meta.env.MODE === 'development')) {
      if (password === DEV_ADMIN_PASSWORD && (email.toLowerCase().includes('admin') || email.endsWith('@whimsical.local'))) {
        return { data: { user: { email } }, error: null }
      }
    }
    return { data: null, error: handled }
  }
}

// Explicit dev sign-in helper (callable from UI) — returns same shape as `signIn`.
export const devSignIn = async (email, password) => {
  if (!DEV_BYPASS) return { data: null, error: { message: 'Dev bypass disabled' } }
  if (password === DEV_ADMIN_PASSWORD && (email.toLowerCase().includes('admin') || email.endsWith('@whimsical.local'))) {
    return { data: { user: { email } }, error: null }
  }
  return { data: null, error: { message: 'Invalid dev credentials' } }
}

/**
 * Sign out
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    return { user: null, error: handleSupabaseError(error) }
  }
}

/**
 * Get current session
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session, error: null }
  } catch (error) {
    return { session: null, error: handleSupabaseError(error) }
  }
}

/**
 * Check if user is admin
 */
export const isAdmin = async () => {
  try {
    const { user } = await getCurrentUser()
    if (!user) return false
    const um = user.user_metadata || {}
    const am = user.app_metadata || {}
    const email = (user.email || '').toLowerCase()
    return um.role === 'admin' || am.role === 'admin' || email === 'admin@whimsical.local'
  } catch {
    return false
  }
}

/**
 * Reset password
 */
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Update password
 */
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

