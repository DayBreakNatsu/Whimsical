import { supabase, handleSupabaseError } from '../lib/supabase'

/**
 * Get reviews for a product
 */
export const getProductReviews = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Add a review to a product
 */
export const addReview = async (review) => {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert([review])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Delete a review (admin or review owner)
 */
export const deleteReview = async (reviewId) => {
  try {
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

