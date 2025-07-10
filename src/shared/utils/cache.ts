interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
}

class LRUCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private accessOrder = new Map<string, number>();
  private maxSize: number;
  private defaultTTL: number;
  private accessCounter = 0;
  private hitCount = 0;
  private missCount = 0;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 60000; // 1 minute default
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    // Remove expired items before adding new one
    this.cleanup();
    
    // If at max capacity, remove least recently used item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.removeLRU();
    }
    
    this.cache.set(key, {
      data: value,
      timestamp: now,
      expiresAt,
      accessCount: 0,
      lastAccessed: now
    });
    
    this.accessOrder.set(key, ++this.accessCounter);
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.missCount++;
      return null;
    }
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.missCount++;
      return null;
    }
    
    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.accessOrder.set(key, ++this.accessCounter);
    this.hitCount++;
    
    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
    this.hitCount = 0;
    this.missCount = 0;
  }

  private removeLRU(): void {
    let lruKey = '';
    let lruAccess = Infinity;
    
    for (const [key, access] of this.accessOrder) {
      if (access < lruAccess) {
        lruAccess = access;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
      this.accessOrder.delete(lruKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });
  }

  // Get cache statistics
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
      totalRequests
    };
  }

  // Get cache entries for debugging
  getEntries(): Array<{ key: string; accessCount: number; lastAccessed: number; expiresAt: number }> {
    const entries: Array<{ key: string; accessCount: number; lastAccessed: number; expiresAt: number }> = [];
    
    for (const [key, item] of this.cache) {
      entries.push({
        key,
        accessCount: item.accessCount,
        lastAccessed: item.lastAccessed,
        expiresAt: item.expiresAt
      });
    }
    
    return entries.sort((a, b) => b.lastAccessed - a.lastAccessed);
  }
}

// Global cache instances with optimized settings
export const personFilmographyCache = new LRUCache<any>({
  ttl: 300000, // 5 minutes - longer for person data
  maxSize: 50
});

export const movieDetailsCache = new LRUCache<any>({
  ttl: 600000, // 10 minutes - longer for movie details
  maxSize: 200 // Increased size for better hit rate
});

export const searchCache = new LRUCache<any>({
  ttl: 60000, // 1 minute - shorter for search results
  maxSize: 50
});

export const userContentCache = new LRUCache<any>({
  ttl: 86400000, // 24 hours - long cache for user-rated/watchlisted content
  maxSize: 500 // Large cache for user content
});

// Cache key generators with better collision avoidance
export const generateCacheKey = {
  personFilmography: (personId: number) => `person_filmography_${personId}`,
  movieDetails: (movieId: number) => `movie_details_${movieId}`,
  tvDetails: (tvId: number) => `tv_details_${tvId}`,
  search: (query: string, type: string) => `search_${type}_${query.toLowerCase().trim().replace(/\s+/g, '_')}`,
  userContent: (contentId: number, mediaType: 'movie' | 'tv') => `user_content_${mediaType}_${contentId}`
};

// Cache monitoring and cleanup
export const cacheManager = {
  getAllStats() {
    return {
      personFilmography: personFilmographyCache.getStats(),
      movieDetails: movieDetailsCache.getStats(),
      search: searchCache.getStats(),
      userContent: userContentCache.getStats()
    };
  },

  clearAll() {
    personFilmographyCache.clear();
    movieDetailsCache.clear();
    searchCache.clear();
    userContentCache.clear();
  },

  getMemoryUsage() {
    const stats = this.getAllStats();
    return {
      totalEntries: stats.personFilmography.size + stats.movieDetails.size + stats.search.size + stats.userContent.size,
      totalHitRate: (
        (stats.personFilmography.hitRate + stats.movieDetails.hitRate + stats.search.hitRate + stats.userContent.hitRate) / 4
      ).toFixed(2)
    };
  }
};