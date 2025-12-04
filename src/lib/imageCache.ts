/**
 * Image Caching Utility
 * 
 * Provides persistent image caching using:
 * 1. In-memory Map for instant access
 * 2. Browser Cache API for persistence across reloads
 * 
 * Usage:
 * - Import and use `useCachedImage(url)` hook for single images
 * - Use `preloadImages(urls)` to preload multiple images in background
 * - Use `clearImageCache()` to clear all cached images
 */

// In-memory cache for blob URLs (instant access)
const memoryCache = new Map<string, string>();
const loadingPromises = new Map<string, Promise<string>>();

const CACHE_NAME = 'osp-images-v1';

/**
 * Get image from cache or fetch and cache it
 */
export const cacheImage = async (url: string): Promise<string> => {
  if (!url) return url;
  
  // Return cached version if available
  if (memoryCache.has(url)) {
    return memoryCache.get(url)!;
  }
  
  // Return existing promise if already loading
  if (loadingPromises.has(url)) {
    return loadingPromises.get(url)!;
  }
  
  // Start loading
  const loadPromise = (async () => {
    try {
      // Try browser Cache API first (persists across sessions)
      if ('caches' in window) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(url);
          
          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            memoryCache.set(url, blobUrl);
            loadingPromises.delete(url);
            return blobUrl;
          }
        } catch (e) {
          // Cache API might fail in some contexts, continue to fetch
        }
      }
      
      // Fetch and cache
      const response = await fetch(url, { 
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Store in memory cache
      memoryCache.set(url, blobUrl);
      
      // Store in browser Cache API for persistence
      if ('caches' in window) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(url, new Response(blob.slice()));
        } catch (e) {
          // Silently fail cache storage
        }
      }
      
      loadingPromises.delete(url);
      return blobUrl;
    } catch (error) {
      loadingPromises.delete(url);
      // Fall back to original URL if caching fails
      return url;
    }
  })();
  
  loadingPromises.set(url, loadPromise);
  return loadPromise;
};

/**
 * Check if an image is already cached (instant check)
 */
export const isImageCached = (url: string): boolean => {
  return memoryCache.has(url);
};

/**
 * Get cached URL if available, otherwise return original
 */
export const getCachedUrl = (url: string): string => {
  return memoryCache.get(url) || url;
};

/**
 * Preload multiple images in background
 */
export const preloadImages = (urls: string[]): void => {
  urls.forEach(url => {
    if (url && !memoryCache.has(url) && !loadingPromises.has(url)) {
      cacheImage(url).catch(() => {}); // Silent fail for preloading
    }
  });
};

/**
 * Preload images in batches to avoid overwhelming the browser
 */
export const preloadImagesBatched = (urls: string[], batchSize = 5, delayMs = 100): void => {
  const uniqueUrls = [...new Set(urls.filter(url => url && !memoryCache.has(url)))];
  let currentBatch = 0;
  
  const loadNextBatch = () => {
    const start = currentBatch * batchSize;
    const batch = uniqueUrls.slice(start, start + batchSize);
    
    if (batch.length > 0) {
      preloadImages(batch);
      currentBatch++;
      setTimeout(loadNextBatch, delayMs);
    }
  };
  
  loadNextBatch();
};

/**
 * Clear all cached images
 */
export const clearImageCache = async (): Promise<void> => {
  // Revoke all blob URLs to free memory
  memoryCache.forEach(blobUrl => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Ignore errors
    }
  });
  memoryCache.clear();
  loadingPromises.clear();
  
  // Clear browser cache
  if ('caches' in window) {
    try {
      await caches.delete(CACHE_NAME);
    } catch (e) {
      // Silently fail
    }
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): { memoryCached: number; loading: number } => {
  return {
    memoryCached: memoryCache.size,
    loading: loadingPromises.size
  };
};

// React hook for cached images
import { useState, useEffect } from 'react';

export const useCachedImage = (url: string | undefined) => {
  const [cachedUrl, setCachedUrl] = useState<string | undefined>(() => {
    // Check memory cache immediately during initial render
    if (url && memoryCache.has(url)) {
      return memoryCache.get(url);
    }
    return url;
  });
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!url) {
      setCachedUrl(undefined);
      return;
    }
    
    // Check memory cache first (instant)
    if (memoryCache.has(url)) {
      setCachedUrl(memoryCache.get(url));
      return;
    }
    
    // Load and cache
    setIsLoading(true);
    cacheImage(url)
      .then(cached => setCachedUrl(cached))
      .finally(() => setIsLoading(false));
  }, [url]);
  
  return { cachedUrl, isLoading, isCached: url ? memoryCache.has(url) : false };
};

/**
 * Hook to preload images when component mounts
 */
export const usePreloadImages = (urls: string[], delay = 500) => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      preloadImagesBatched(urls);
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [urls, delay]);
};
