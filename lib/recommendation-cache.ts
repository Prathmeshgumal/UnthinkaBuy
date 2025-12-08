/**
 * Recommendation Cache Service
 * Stores 20 recommendations in localStorage and only refreshes on major user activity
 */

import type { RecommendedProduct } from "./types"
import { fetchUserRecommendations } from "./products-data"

const CACHE_KEY = "user_recommendations_cache"
const CACHE_TIMESTAMP_KEY = "user_recommendations_timestamp"
const CACHE_USER_KEY = "user_recommendations_user_id"
const CACHE_SIZE = 20
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export interface RecommendationCache {
  products: RecommendedProduct[]
  timestamp: number
  userId: string
  displayedCount: number
}

export function getCachedRecommendations(userId: string): RecommendedProduct[] {
  if (typeof window === "undefined") return []

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    const cachedUserId = localStorage.getItem(CACHE_USER_KEY)

    // Check if cache exists and is for the same user
    if (!cached || !timestamp || cachedUserId !== userId) {
      return []
    }

    const cacheData: RecommendationCache = JSON.parse(cached)
    const cacheTime = parseInt(timestamp, 10)
    const now = Date.now()

    // Check if cache is still valid (within 24 hours)
    if (now - cacheTime > CACHE_DURATION) {
      clearRecommendationCache()
      return []
    }

    return cacheData.products || []
  } catch (error) {
    console.error("[RecommendationCache] Error reading cache:", error)
    return []
  }
}

export function setCachedRecommendations(userId: string, products: RecommendedProduct[]): void {
  if (typeof window === "undefined") return

  try {
    const cacheData: RecommendationCache = {
      products: products.slice(0, CACHE_SIZE), // Only store 20 products
      timestamp: Date.now(),
      userId,
      displayedCount: 6, // Initial display count
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()))
    localStorage.setItem(CACHE_USER_KEY, userId)
  } catch (error) {
    console.error("[RecommendationCache] Error setting cache:", error)
  }
}

export function clearRecommendationCache(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(CACHE_TIMESTAMP_KEY)
  localStorage.removeItem(CACHE_USER_KEY)
}

export function getDisplayedCount(): number {
  if (typeof window === "undefined") return 6

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return 6

    const cacheData: RecommendationCache = JSON.parse(cached)
    return cacheData.displayedCount || 6
  } catch {
    return 6
  }
}

export function setDisplayedCount(count: number): void {
  if (typeof window === "undefined") return

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return

    const cacheData: RecommendationCache = JSON.parse(cached)
    cacheData.displayedCount = count
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.error("[RecommendationCache] Error updating displayed count:", error)
  }
}

export async function refreshRecommendations(userId: string): Promise<RecommendedProduct[]> {
  try {
    console.log("[RecommendationCache] Refreshing recommendations for user:", userId)
    const recs = await fetchUserRecommendations(userId, CACHE_SIZE)
    
    if (recs && recs.length > 0) {
      // Deduplicate
      const uniqueRecs = recs.filter((product, index, self) => 
        index === self.findIndex((p) => p.id === product.id)
      )
      
      setCachedRecommendations(userId, uniqueRecs)
      return uniqueRecs
    }
    
    return []
  } catch (error) {
    console.error("[RecommendationCache] Error refreshing recommendations:", error)
    return []
  }
}

