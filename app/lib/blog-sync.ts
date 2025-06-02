/**
 * Blog sync utility for managing cache invalidation across route handlers
 * This module provides shared state management for blog cache synchronization
 */

// Cache-Invalidierung für Blog-Posts
let lastSyncTime = 0;

/**
 * Get the timestamp of the last blog sync/cache invalidation
 * @returns {number} Timestamp in milliseconds
 */
export function getLastSyncTime(): number {
  return lastSyncTime;
}

/**
 * Set the timestamp of the last blog sync/cache invalidation
 * @param {number} timestamp - Timestamp in milliseconds
 */
export function setLastSyncTime(timestamp: number): void {
  lastSyncTime = timestamp;
}

/**
 * Check if the cache should be invalidated based on sync time
 * @param {number} lastFetch - Timestamp of last cache fetch
 * @param {number} cacheDuration - Cache duration in milliseconds
 * @returns {boolean} True if cache should be invalidated
 */
export function shouldInvalidateCache(lastFetch: number, cacheDuration: number): boolean {
  const now = Date.now();
  const lastSync = getLastSyncTime();
  
  // Cache is invalid if:
  // 1. Cache duration has expired, OR
  // 2. A sync was triggered after the last fetch
  return (now - lastFetch) >= cacheDuration || lastSync > lastFetch;
}
