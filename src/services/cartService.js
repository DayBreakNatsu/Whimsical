import { supabase, handleSupabaseError } from '../lib/supabase'

/**
 * Get user's cart (for authenticated users)
 */
export const getUserCart = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('carts')
      .select(`
        *,
        products (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Add item to cart
 */
export const addToCart = async (userId, productId, quantity = 1) => {
  try {
    // Check if item already exists in cart
    const { data: existing } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    if (existing) {
      // Update quantity if item exists
      const { data, error } = await supabase
        .from('carts')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from('carts')
        .insert([{ user_id: userId, product_id: productId, quantity }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Update cart item quantity
 */
export const updateCartItem = async (userId, productId, quantity) => {
  try {
    if (quantity <= 0) {
      // Remove item if quantity is 0
      return await removeFromCart(userId, productId)
    }

    const { data, error } = await supabase
      .from('carts')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Remove item from cart
 */
export const removeFromCart = async (userId, productId) => {
  try {
    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

/**
 * Clear user's entire cart
 */
export const clearCart = async (userId) => {
  try {
    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

