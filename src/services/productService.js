import { supabase, handleSupabaseError } from '../lib/supabase'

// Normalize DB product rows (snake_case) to app-friendly camelCase
const normalizeProduct = (p) => {
  if (!p) return p
  return {
    ...p,
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    image: p.image,
    gallery: Array.isArray(p.gallery) ? p.gallery : p.gallery ? [p.gallery] : [],
    stock: p.stock,
    isNew: p.is_new ?? p.isNew ?? false,
    isOnSale: p.is_on_sale ?? p.isOnSale ?? false,
    isFeatured: p.is_featured ?? p.isFeatured ?? false,
    isLimitedStock: p.is_limited_stock ?? p.isLimitedStock ?? false,
    isSample: p.is_sample ?? p.isSample ?? false,
    createdBy: p.created_by ?? p.createdBy ?? null,
    createdAt: p.created_at ?? p.createdAt,
    reviews: p.reviews ?? p.review_list ?? null,
  }
}

/**
 * Fetch all products
 */
export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: (data || []).map(normalizeProduct), error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Fetch a single product by ID
 */
export const getProductById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: normalizeProduct(data), error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Create a new product (admin only)
 */
export const createProduct = async (product) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Update a product (admin only)
 */
export const updateProduct = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Delete a product (admin only)
 */
export const deleteProduct = async (id) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

/**
 * Get products by category
 */
export const getProductsByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: (data || []).map(normalizeProduct), error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Get new products
 */
export const getNewProducts = async (limit = 4) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_new', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data: (data || []).map(normalizeProduct), error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

