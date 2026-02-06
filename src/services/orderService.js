import { supabase, handleSupabaseError } from '../lib/supabase'

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (error) {
      // Check for specific error patterns
      if (error.message?.includes('Insufficient stock')) {
        return { 
          data: null, 
          error: {
            error: error.message.replace('Insufficient stock: ', ''),
            code: 'INSUFFICIENT_STOCK'
          } 
        }
      }
      if (error.message?.includes('not found')) {
        return { 
          data: null, 
          error: {
            error: 'One or more products are no longer available. Please refresh and try again.',
            code: 'PRODUCT_NOT_FOUND'
          } 
        }
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Order creation error:', error)
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Get user's orders
 */
export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Get all orders (for admin)
 */
export const getAllOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Get order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Update order status (admin only)
 */
export const updateOrderStatus = async (orderId, status, paymentStatus = null) => {
  try {
    const updates = { status }
    if (paymentStatus) updates.payment_status = paymentStatus

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Delete order (admin only)
 */
export const deleteOrder = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

