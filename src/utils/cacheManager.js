/**
 * Client-side caching utility for data management
 * Reduces API calls and improves performance
 */

const CACHE_PREFIX = 'whimsical_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

class CacheManager {
  constructor() {
    this.memory = new Map();
    this.ttlMap = new Map();
  }

  /**
   * Set cache with TTL (Time To Live)
   */
  set(key, value, ttl = DEFAULT_TTL) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const timestamp = Date.now();

    // In-memory cache
    this.memory.set(cacheKey, value);
    this.ttlMap.set(cacheKey, timestamp + ttl);

    // LocalStorage cache (for persistence across sessions)
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        value,
        expires: timestamp + ttl
      }));
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }

    // Clear old item if it exists
    this.scheduleCleanup(cacheKey, ttl);
  }

  /**
   * Get cache value
   */
  get(key) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const now = Date.now();

    // Check if expired
    const expiresAt = this.ttlMap.get(cacheKey);
    if (expiresAt && now > expiresAt) {
      this.delete(key);
      return null;
    }

    // Try memory first
    if (this.memory.has(cacheKey)) {
      return this.memory.get(cacheKey);
    }

    // Try localStorage
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const { value, expires } = JSON.parse(stored);
        if (now < expires) {
          this.memory.set(cacheKey, value);
          return value;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (e) {
      console.warn('Error reading from cache:', e);
    }

    return null;
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    this.memory.delete(cacheKey);
    this.ttlMap.delete(cacheKey);
    
    try {
      localStorage.removeItem(cacheKey);
    } catch (e) {
      console.warn('Error deleting cache:', e);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memory.clear();
    this.ttlMap.clear();

    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Error clearing cache:', e);
    }
  }

  /**
   * Schedule cleanup of expired items
   */
  scheduleCleanup(key, ttl) {
    setTimeout(() => {
      this.delete(key);
    }, ttl + 1000); // Add 1 second buffer
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      memorySize: this.memory.size,
      localStorageSize: Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).length
    };
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

/**
 * Wrapper for caching API calls
 */
export const cachedFetch = async (key, fetcher, ttl = DEFAULT_TTL) => {
  // Try to get from cache
  const cached = cacheManager.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  try {
    const data = await fetcher();
    cacheManager.set(key, data, ttl);
    return data;
  } catch (error) {
    // Return stale cache on error if available
    const stale = cacheManager.get(key);
    if (stale !== null) {
      console.warn(`Using stale cache for ${key}:`, error);
      return stale;
    }
    throw error;
  }
};

/**
 * Invalidate specific cache patterns
 */
export const invalidateCache = (pattern) => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    });
    
    // Also clear from memory cache
    Array.from(cacheManager.memory.keys()).forEach(key => {
      if (key.includes(pattern)) {
        cacheManager.delete(key.replace(CACHE_PREFIX, ''));
      }
    });
  } catch (e) {
    console.warn('Error invalidating cache:', e);
  }
};

export default {
  cacheManager,
  cachedFetch,
  invalidateCache
};
