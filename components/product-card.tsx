"use client"

import { Star, Heart, ShoppingCart } from "lucide-react"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { addToCart, toggleFavorite } from "@/lib/cart-favorites"
import { clearRecommendationCache, refreshRecommendations } from "@/lib/recommendation-cache"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
  product: Product
  isBestseller?: boolean
  compact?: boolean
  initialFavorited?: boolean
  onClick?: (product: Product) => void
}

export function ProductCard({
  product,
  isBestseller = false,
  compact = false,
  initialFavorited = false,
  onClick,
}: ProductCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isWishlisted, setIsWishlisted] = useState(initialFavorited)
  const [imageError, setImageError] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

  const hasDiscount = product.discount_price && product.actual_price && product.discount_price !== product.actual_price

  const calculateDiscount = () => {
    if (!hasDiscount) return 0
    const discountNum = Number.parseInt(product.discount_price!.replace(/[^0-9]/g, ""))
    const actualNum = Number.parseInt(product.actual_price!.replace(/[^0-9]/g, ""))
    return Math.round(((actualNum - discountNum) / actualNum) * 100)
  }

  const ratingValue = Number.parseFloat(product.ratings || "0")

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating)
            ? "fill-warning text-warning"
            : i < rating
              ? "fill-warning/50 text-warning"
              : "text-muted"
          }`}
      />
    ))
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart",
        variant: "destructive",
      })
      return
    }

    setIsAddingToCart(true)
    try {
      await addToCart(product.id, 1)
      // Refresh recommendations cache on major user activity
      if (user) {
        clearRecommendationCache()
        refreshRecommendations(user.id).catch(console.error)
      }
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add favorites",
        variant: "destructive",
      })
      return
    }

    setIsTogglingFavorite(true)
    try {
      await toggleFavorite(product.id, isWishlisted)
      setIsWishlisted(!isWishlisted)
      // Refresh recommendations cache on major user activity
      if (user && !isWishlisted) { // Only refresh when adding, not removing
        clearRecommendationCache()
        refreshRecommendations(user.id).catch(console.error)
      }
      toast({
        title: isWishlisted ? "Removed from favorites" : "Added to favorites",
        description: isWishlisted
          ? `${product.name} removed from favorites`
          : `${product.name} added to favorites`,
      })
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      })
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(product)
    }
  }

  if (compact) {
    return (
      <div
        className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {isBestseller && (
            <span className="absolute top-1 left-1 z-10 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded">
              BESTSELLER
            </span>
          )}

          <button
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className="absolute top-1 right-1 z-10 p-1 rounded-full bg-background/80 hover:bg-background transition-colors disabled:opacity-50"
          >
            <Heart className={`h-3 w-3 ${isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>

          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-xs">Image unavailable</span>
            </div>
          ) : (
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Content */}
        <div className="p-2 space-y-1 flex-1 flex flex-col">
          {/* Category */}
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide line-clamp-1">{product.sub_category}</span>

          {/* Product Name */}
          <h3 className="text-xs font-medium text-foreground line-clamp-2 min-h-[2rem] leading-tight flex-1">{product.name}</h3>

          {/* Price */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-sm font-bold text-foreground">{product.discount_price || product.actual_price}</span>
            {hasDiscount && (
              <>
                <span className="text-[10px] text-muted-foreground line-through">{product.actual_price}</span>
                <span className="text-[10px] font-medium text-success">{calculateDiscount()}% Off</span>
              </>
            )}
          </div>

          {/* Ratings */}
          {product.ratings && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-2 w-2 ${i < Math.floor(ratingValue)
                        ? "fill-warning text-warning"
                        : i < ratingValue
                          ? "fill-warning/50 text-warning"
                          : "text-muted"
                      }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">({product.no_of_ratings || "0"})</span>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="w-full mt-1 h-7 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent disabled:opacity-50"
          >
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {isBestseller && (
          <span className="absolute top-1 left-1 z-10 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded">
            BESTSELLER
          </span>
        )}

        <button
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
          className="absolute top-1 right-1 z-10 p-1 rounded-full bg-background/80 hover:bg-background transition-colors disabled:opacity-50"
        >
          <Heart className={`h-3 w-3 ${isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>

        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-xs">Image unavailable</span>
          </div>
        ) : (
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-2 space-y-1 flex-1 flex flex-col">
        {/* Category */}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide line-clamp-1">{product.sub_category}</span>

        {/* Product Name */}
        <h3 className="text-xs font-medium text-foreground line-clamp-2 min-h-[2rem] leading-tight flex-1">{product.name}</h3>

        {/* Price */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-sm font-bold text-foreground">{product.discount_price || product.actual_price}</span>
          {hasDiscount && (
            <>
              <span className="text-[10px] text-muted-foreground line-through">{product.actual_price}</span>
              <span className="text-[10px] font-medium text-success">{calculateDiscount()}% Off</span>
            </>
          )}
        </div>

        {/* Ratings - using parsed ratingValue */}
        {product.ratings && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-2 w-2 ${i < Math.floor(ratingValue)
                      ? "fill-warning text-warning"
                      : i < ratingValue
                        ? "fill-warning/50 text-warning"
                        : "text-muted"
                    }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">({product.no_of_ratings || "0"})</span>
          </div>
        )}

        {/* Add to Cart Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="w-full mt-1 h-7 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent disabled:opacity-50"
        >
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </Button>
      </div>
    </div>
  )
}
