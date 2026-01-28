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
    sku: p.sku,
    isNew: p.is_new ?? p.isNew ?? false,
    isOnSale: p.is_on_sale ?? p.isOnSale ?? false,
    isFeatured: p.is_featured ?? p.isFeatured ?? false,
    isLimitedStock: p.is_limited_stock ?? p.isLimitedStock ?? false,
    isSample: p.is_sample ?? p.isSample ?? false,
    variants: p.variants ? (Array.isArray(p.variants) ? p.variants : [p.variants]) : [],
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

/**
 * Get variants for a product
 */
export const getProductVariants = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Create a variant for a product
 */
export const createVariant = async (productId, variant) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .insert([
        {
          product_id: productId,
          type: variant.type, // 'size', 'color', etc
          value: variant.value,
          sku: variant.sku,
          price_modifier: variant.priceModifier || 0,
          stock: variant.stock || 0
        }
      ])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Update a variant
 */
export const updateVariant = async (variantId, updates) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .update(updates)
      .eq('id', variantId)
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Delete a variant
 */
export const deleteVariant = async (variantId) => {
  try {
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: handleSupabaseError(error) }
  }
}

