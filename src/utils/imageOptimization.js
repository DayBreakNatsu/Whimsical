/**
 * Image Optimization Utility
 * Handles lazy loading, WebP fallbacks, and responsive images
 */

/**
 * Get optimized image URL with size parameters
 * @param {string} url - Original image URL
 * @param {number} width - Desired width
 * @param {number} quality - Quality 1-100 (default 80)
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (url, width = 800, quality = 80) => {
  if (!url) return null;
  
  // If it's a relative path or data URL, return as-is
  if (url.startsWith('/') || url.startsWith('data:')) return url;
  
  // For Supabase URLs, add optimization parameters
  if (url.includes('supabase')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}`;
  }
  
  return url;
};

/**
 * Create responsive image srcset for modern formats
 * @param {string} url - Image URL
 * @returns {Object} Object with webp and fallback srcsets
 */
export const getResponsiveImageSrcset = (url) => {
  if (!url) return { webp: '', fallback: '' };
  
  const sizes = [320, 640, 1024, 1280];
  
  // For Supabase images
  if (url.includes('supabase')) {
    const webpSrcset = sizes
      .map(size => `${getOptimizedImageUrl(url, size)} ${size}w`)
      .join(', ');
    const fallbackSrcset = sizes
      .map(size => `${getOptimizedImageUrl(url, size)} ${size}w`)
      .join(', ');
    return { webp: webpSrcset, fallback: fallbackSrcset };
  }
  
  return { webp: url, fallback: url };
};

/**
 * Image component with lazy loading and WebP support
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text
 * @param {string} className - CSS classes
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {JSX.Element}
 */
export const OptimizedImage = ({ src, alt, className = '', width, height, ...props }) => {
  if (!src) return null;
  
  const srcset = getResponsiveImageSrcset(src);
  
  return (
    <picture>
      {/* WebP format for modern browsers */}
      <source
        srcSet={srcset.webp}
        type="image/webp"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      {/* Fallback for older browsers */}
      <source
        srcSet={srcset.fallback}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      {/* Lazy loading image */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
        width={width}
        height={height}
        {...props}
      />
    </picture>
  );
};

/**
 * Preload critical images
 * @param {string[]} urls - Array of image URLs to preload
 */
export const preloadImages = (urls) => {
  if (typeof window === 'undefined') return;
  
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Check WebP support
 * @returns {boolean}
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
};

/**
 * Get image format based on browser support
 * @returns {string} 'webp' or 'jpg'
 */
export const getPreferredImageFormat = () => {
  return supportsWebP() ? 'webp' : 'jpg';
};

export default {
  getOptimizedImageUrl,
  getResponsiveImageSrcset,
  OptimizedImage,
  preloadImages,
  supportsWebP,
  getPreferredImageFormat
};
