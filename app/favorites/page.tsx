"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchFavorites, removeFromFavorites, addToCart } from "@/lib/cart-favorites"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface FavoriteItem {
  id: string
  product_id: string
  added_at: string
  products: {
    id: string
    name: string
    image: string
    discount_price: string | null
    actual_price: string | null
    sub_category: string
    ratings: string | null
    no_of_ratings: string | null
  }
}

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
      return
    }
    if (user) {
      loadFavorites()
    }
  }, [user, authLoading, router])

  const loadFavorites = async () => {
    try {
      setIsLoading(true)
      const data = await fetchFavorites()
      setFavoriteItems(data.favorites || [])
    } catch (error) {
      console.error("Failed to load favorites:", error)
      toast({
        title: "Error",
        description: "Failed to load favorites",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (productId: string) => {
    setProcessingItems((prev) => new Set(prev).add(productId))
    try {
      await removeFromFavorites(productId)
      await loadFavorites()
      toast({
        title: "Removed from favorites",
        description: "Item removed from your wishlist",
      })
    } catch (error) {
      console.error("Failed to remove item:", error)
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      })
    } finally {
      setProcessingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleAddToCart = async (productId: string, productName: string) => {
    setProcessingItems((prev) => new Set(prev).add(productId))
    try {
      await addToCart(productId, 1)
      toast({
        title: "Added to cart",
        description: `${productName} has been added to your cart`,
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setProcessingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Heart className="h-8 w-8 fill-red-500 text-red-500" />
            My Favorites ({favoriteItems.length})
          </h1>

          {favoriteItems.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">No favorites yet</h2>
              <p className="text-muted-foreground mb-6">Save your favorite products to view them here!</p>
              <Button onClick={() => router.push("/")} className="bg-primary text-primary-foreground">
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    <button
                      onClick={() => handleRemove(item.product_id)}
                      disabled={processingItems.has(item.product_id)}
                      className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors disabled:opacity-50"
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </button>
                    
                    <Image
                      src={item.products.image || "/placeholder.svg"}
                      alt={item.products.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="p-4 space-y-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide capitalize">
                      {item.products.sub_category}
                    </span>

                    <h3 className="text-sm font-medium text-foreground line-clamp-2 min-h-[2.5rem]">
                      {item.products.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {item.products.discount_price || item.products.actual_price}
                      </span>
                      {item.products.discount_price && item.products.actual_price && item.products.discount_price !== item.products.actual_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {item.products.actual_price}
                        </span>
                      )}
                    </div>

                    {/* Ratings */}
                    {item.products.ratings && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>⭐ {item.products.ratings}</span>
                        <span>({item.products.no_of_ratings || "0"})</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCart(item.product_id, item.products.name)}
                        disabled={processingItems.has(item.product_id)}
                        className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(item.product_id)}
                        disabled={processingItems.has(item.product_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}







