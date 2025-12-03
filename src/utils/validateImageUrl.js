/**
 * Validates and sanitizes image URLs
 * @param {string} url - The image URL to validate
 * @param {string} fallback - Fallback URL if validation fails
 * @returns {string} - Valid URL or fallback
 */
export const validateImageUrl = (url, fallback = 'https://via.placeholder.com/400x300/F5E6D3/8B4513?text=Image') => {
  if (!url || typeof url !== 'string') {
    return fallback;
  }
  
  // Check if URL is complete and valid
  const isAbsoluteUrl = url.startsWith('http://') || url.startsWith('https://');
  const isRelativePath = url.startsWith('/');
  
  // If it's not absolute or relative, it's likely corrupted
  if (!isAbsoluteUrl && !isRelativePath) {
    return fallback;
  }
  
  // Additional validation for placeholder URLs
  if (url.includes('via.placeholder.com') && !url.startsWith('https://')) {
    return fallback;
  }
  
  return url;
};

export default validateImageUrl;

