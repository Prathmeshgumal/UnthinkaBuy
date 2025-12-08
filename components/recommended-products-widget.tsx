"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import type { RecommendedProduct } from "@/lib/types"
import { RecommendationRow } from "@/components/recommendation-row"
import {
    getCachedRecommendations,
    setCachedRecommendations,
    getDisplayedCount,
    setDisplayedCount,
    refreshRecommendations,
} from "@/lib/recommendation-cache"

export function RecommendedProductsWidget() {
    const { user } = useAuth()
    const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([])
    const [displayedCount, setDisplayedCountState] = useState(6)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!user) {
            setRecommendations([])
            setError(null)
            return
        }

        // Load from cache first
        const cached = getCachedRecommendations(user.id)
        const cachedDisplayCount = getDisplayedCount()

        if (cached.length > 0) {
            // Check if cached items have the 'reason' field (backwards compatibility/fix)
            const hasReasons = cached.some(p => !!p.reason)

            if (hasReasons) {
                console.log("[RecWidget] Loaded", cached.length, "recommendations from cache")
                setRecommendations(cached)
                setDisplayedCountState(cachedDisplayCount)
                setLoading(false)
            } else {
                console.log("[RecWidget] Cache exists but missing reasons. Forcing refresh.")
                // Fall through to fetch new data
                setRecommendations([])
            }
        }

        if (cached.length === 0 || !cached.some(p => !!p.reason)) {
            // Only fetch if no cache
            const loadRecs = async () => {
                setLoading(true)
                setError(null)
                try {
                    console.log("[RecWidget] No cache, fetching for", user.id)
                    const recs = await refreshRecommendations(user.id)
                    if (recs && recs.length > 0) {
                        setRecommendations(recs)
                        setDisplayedCountState(6)
                        setError(null)
                    } else {
                        setRecommendations([])
                        setError("No recommendations available yet. Add items to your cart or favorites to get personalized recommendations!")
                    }
                } catch (e) {
                    console.error("[RecWidget] Error:", e)
                    setError("Failed to load recommendations")
                    setRecommendations([])
                } finally {
                    setLoading(false)
                }
            }
            loadRecs()
        }
    }, [user])

    const handleShowMore = () => {
        const newCount = Math.min(displayedCount + 6, recommendations.length)
        setDisplayedCountState(newCount)
        setDisplayedCount(newCount)
    }

    if (!user) {
        return null
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-muted-foreground">
                    Loading recommendations...
                </div>
            </div>
        )
    }

    if (error && recommendations.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-sm text-muted-foreground">
                    {error}
                </div>
            </div>
        )
    }

    if (recommendations.length === 0) {
        return null
    }

    return (
        <div className="container mx-auto px-4">
            <RecommendationRow
                products={recommendations}
            />
        </div>
    )
}
