import { supabase, handleSupabaseError } from '../lib/supabase'

/**
 * Storage bucket name for product images
 */
const PRODUCT_IMAGES_BUCKET = 'product-images'

/**
 * Upload an image file to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} folder - Optional folder path (e.g., 'products', 'gallery')
 * @param {string} fileName - Optional custom file name (defaults to timestamp + original name)
 * @returns {Promise<{data: string|null, error: object|null}>} - Public URL or error
 */
export const uploadImage = async (file, folder = 'products', fileName = null) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB')
    }

    // Generate unique file name
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const finalFileName = fileName || `${timestamp}-${randomString}.${fileExtension}`
    const filePath = `${folder}/${finalFileName}`

    // Upload file to Supabase Storage
    const { data: _uploadData, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(filePath)

    return { data: urlData.publicUrl, error: null }
  } catch (error) {
    console.error('Storage upload error:', error)
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Upload multiple images (for product gallery)
 * @param {File[]} files - Array of image files
 * @param {string} folder - Optional folder path
 * @returns {Promise<{data: string[]|null, error: object|null}>} - Array of public URLs or error
 */
export const uploadMultipleImages = async (files, folder = 'products') => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided')
    }

    const uploadPromises = files.map((file) => uploadImage(file, folder))
    const results = await Promise.all(uploadPromises)

    // Check for errors
    const errors = results.filter((result) => result.error)
    if (errors.length > 0) {
      return {
        data: null,
        error: {
          error: 'Some images failed to upload',
          details: errors,
        },
      }
    }

    const urls = results.map((result) => result.data).filter(Boolean)
    return { data: urls, error: null }
  } catch (error) {
    console.error('Multiple image upload error:', error)
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Delete an image from Supabase Storage
 * @param {string} filePath - The path to the file in storage (e.g., 'products/image.jpg')
 * @returns {Promise<{error: object|null}>}
 */
export const deleteImage = async (filePath) => {
  try {
    if (!filePath) {
      throw new Error('No file path provided')
    }

    // Extract path from full URL if needed
    let path = filePath
    if (filePath.includes(PRODUCT_IMAGES_BUCKET)) {
      const urlParts = filePath.split(`${PRODUCT_IMAGES_BUCKET}/`)
      path = urlParts[urlParts.length - 1]
    }

    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([path])

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Storage delete error:', error)
    return { error: handleSupabaseError(error) }
  }
}

/**
 * Delete multiple images
 * @param {string[]} filePaths - Array of file paths
 * @returns {Promise<{error: object|null}>}
 */
export const deleteMultipleImages = async (filePaths) => {
  try {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return { error: null }
    }

    // Extract paths from URLs
    const paths = filePaths.map((filePath) => {
      if (filePath.includes(PRODUCT_IMAGES_BUCKET)) {
        const urlParts = filePath.split(`${PRODUCT_IMAGES_BUCKET}/`)
        return urlParts[urlParts.length - 1]
      }
      return filePath
    })

    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(paths)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Multiple image delete error:', error)
    return { error: handleSupabaseError(error) }
  }
}

/**
 * Get public URL for an image
 * @param {string} filePath - The path to the file in storage
 * @returns {string} - Public URL
 */
export const getImageUrl = (filePath) => {
  if (!filePath) return null

  // If it's already a full URL, return it
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }

  // Extract path from URL if needed
  let path = filePath
  if (filePath.includes(PRODUCT_IMAGES_BUCKET)) {
    const urlParts = filePath.split(`${PRODUCT_IMAGES_BUCKET}/`)
    path = urlParts[urlParts.length - 1]
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * List images in a folder and return their public URLs
 * @param {string} folder - Folder inside the bucket (default 'products')
 * @param {number} limit - Maximum number of files to list
 * @returns {Promise<{data: string[]|null, error: object|null}>}
 */
export const listImages = async (folder = 'products', limit = 100) => {
  try {
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list(folder, {
        limit,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) throw error

    const urls = (data || [])
      .filter((file) => !file.name.startsWith('.') && !file.name.endsWith('/'))
      .map((file) => {
        const filePath = `${folder}/${file.name}`
        const { data: urlData } = supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .getPublicUrl(filePath)
        return urlData.publicUrl
      })

    return { data: urls, error: null }
  } catch (error) {
    console.error('List images error:', error)
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Get storage usage statistics for the products bucket
 * Note: Supabase free tier has 1GB per project, pro tier has variable limits
 * This function calculates usage based on actual file sizes in your storage
 * @returns {Promise<{data: {files: number, totalSize: number, sizeInMB: number, sizeInGB: number, bucketInfo: string}, error: object|null}>}
 */
export const getStorageStats = async (folder = 'products') => {
  try {
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list(folder, {
        limit: 1000,
        offset: 0,
      })

    if (error) throw error

    let totalSize = 0
    const files = (data || [])
      .filter((file) => !file.name.startsWith('.') && !file.name.endsWith('/'))

    for (const file of files) {
      totalSize += file.metadata?.size || 0
    }

    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)
    const sizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(4)

    // Supabase free tier = 1GB per project, pro tier = higher
    const bucketInfo = 'Supabase Storage'

    return {
      data: {
        files: files.length,
        totalSize,
        sizeInMB,
        sizeInGB,
        bucketInfo,
        usageWarning: sizeInMB > 800 ? 'Approaching storage limits on free tier' : '',
      },
      error: null,
    }
  } catch (error) {
    console.error('Get storage stats error:', error)
    return { data: null, error: handleSupabaseError(error) }
  }
}

/**
 * Clear all images from a folder in storage
 * @param {string} folder - Folder path (default 'products')
 * @returns {Promise<{deletedCount: number, error: object|null}>}
 */
export const clearStorage = async (folder = 'products') => {
  try {
    const { data, error: listError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list(folder, {
        limit: 1000,
        offset: 0,
      })

    if (listError) throw listError

    const files = (data || [])
      .filter((file) => !file.name.startsWith('.') && !file.name.endsWith('/'))
      .map((file) => `${folder}/${file.name}`)

    if (files.length === 0) {
      return { deletedCount: 0, error: null }
    }

    const { error: deleteError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(files)

    if (deleteError) throw deleteError

    return { deletedCount: files.length, error: null }
  } catch (error) {
    console.error('Clear storage error:', error)
    return { deletedCount: 0, error: handleSupabaseError(error) }
  }
}

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getImageUrl,
  listImages,
  getStorageStats,
  clearStorage,
}

