"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ProductCard } from "./product-card"
import { FilterSidebar } from "./filter-sidebar"
import { fetchProductsFromSupabase } from "@/lib/products-data"
import type { Product } from "@/lib/types"
import { Grid3X3, LayoutList, Loader2, ChevronDown, ChevronLeft, ChevronRight, Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { logOrderEvent } from "@/lib/order-events"
import { fetchProductsByIds } from "@/lib/random-cluster-products"
import { addToCart, addToFavorites } from "@/lib/cart-favorites"
import { clearRecommendationCache, refreshRecommendations } from "@/lib/recommendation-cache"
import { RecommendedProduct } from "@/lib/types"
import { RecommendationRow } from "./recommendation-row"
import { Fragment } from "react"
import { getCachedRecommendations } from "@/lib/recommendation-cache"
import { fetchProductsByCluster } from "@/lib/cluster-products"

export function ProductGrid() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category") || undefined
  const selectedSubCategory = searchParams.get("sub_category") || undefined
  const selectedBrand = searchParams.get("brand") || undefined
  const minPrice = searchParams.get("min_price") || undefined
  const maxPrice = searchParams.get("max_price") || undefined
  const minRating = searchParams.get("min_rating") || undefined
  const sortBy = searchParams.get("sort") || "default"

  const highlightId = searchParams.get("highlight") || undefined

  const { user, token } = useAuth()
  const { toast } = useToast()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<Product[]>([])
  const [highlightedProduct, setHighlightedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Scroll functionality
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (sortValue === "default") {
      params.delete("sort")
    } else {
      params.set("sort", sortValue)
    }
    params.delete("page") // Reset to page 1 when sorting changes
    router.push(`/?${params.toString()}`)
  }

  const loadProducts = useCallback(
    async (
      page: number,
      append: boolean = false,
      category?: string,
      subCategory?: string,
      brand?: string,
      minPrice?: string,
      maxPrice?: string,
      minRating?: string,
      sort?: string
    ) => {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      try {
        const result = await fetchProductsFromSupabase(page, 50, category, subCategory, brand, minPrice, maxPrice, minRating, sort)
        if (append) {
          setProducts((prev) => [...prev, ...result.products])
        } else {
          setProducts(result.products)
        }
        setTotal(result.total)
        setHasMore(result.hasMore)
        setCurrentPage(page)
      } catch (error) {
        console.error("[v0] Failed to load products:", error)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  // Reset and load products when filters or sort change
  useEffect(() => {
    setCurrentPage(1)
    setProducts([])
    loadProducts(1, false, selectedCategory, selectedSubCategory, selectedBrand, minPrice, maxPrice, minRating, sortBy)
  }, [selectedCategory, selectedSubCategory, selectedBrand, minPrice, maxPrice, minRating, sortBy, loadProducts])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadProducts(
            currentPage + 1,
            true,
            selectedCategory,
            selectedSubCategory,
            selectedBrand,
            minPrice,
            maxPrice,
            minRating,
            sortBy
          )
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoadingMore, isLoading, currentPage, selectedCategory, selectedSubCategory, selectedBrand, minPrice, maxPrice, minRating, sortBy, loadProducts])

  // When highlightId is present in URL and products are loaded, set highlighted product
  useEffect(() => {
    if (!highlightId) {
      setHighlightedProduct(null)
      return
    }

    const found = products.find((p) => p.id === highlightId)
    if (found) {
      setHighlightedProduct(found)
      return
    }

    // If not found in the current page of products, fetch it directly by ID
    async function fetchHighlighted() {
      if (!highlightId) return
      try {
        const result = await fetchProductsByIds([highlightId])
        if (result && result[0]) {
          setHighlightedProduct(result[0])
        }
      } catch (error) {
        console.error("[ProductGrid] Failed to fetch highlighted product:", error)
      }
    }

    fetchHighlighted()
  }, [highlightId, products])

  // Recommendations Logic - Use cached recommendations
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([])
  const [clusterRecommendations, setClusterRecommendations] = useState<Product[]>([])
  const [showClusterRecs, setShowClusterRecs] = useState(false)

  useEffect(() => {
    if (!user) {
      setRecommendations([])
      return
    }

    // Load from cache
    const cached = getCachedRecommendations(user.id)
    if (cached.length > 0) {
      console.log("[Fe] ProductGrid: Loaded", cached.length, "recommendations from cache")
      setRecommendations(cached)
    }
  }, [user])

  const handleProductClick = async (product: Product) => {
    // Highlight the clicked product at the top
    setHighlightedProduct(product)

    // Update URL with highlight param (keeps back/forward navigation consistent)
    const params = new URLSearchParams(searchParams.toString())
    params.set("highlight", product.id)
    router.push(`/?${params.toString()}`)

    // If product has cluster_id, fetch cluster-based recommendations
    if (product.cluster_id) {
      setShowClusterRecs(true)
      try {
        const clusterProducts = await fetchProductsByCluster(product.cluster_id)
        // Filter out the clicked product
        const filtered = clusterProducts.filter(p => p.id !== product.id)
        setClusterRecommendations(filtered.slice(0, 12))
      } catch (error) {
        console.error("[ProductGrid] Error fetching cluster products:", error)
      }
    }
  }

  const handleBuyNow = async (product: Product) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place an order.",
        variant: "destructive",
      })
      return
    }

    // Log the Buy Now click (fire-and-forget)
    logOrderEvent(product.id, "buy_now_clicked", token).catch(console.error)

    const params = new URLSearchParams()
    params.set("productId", product.id)
    router.push(`/checkout?${params.toString()}`)
  }

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to cart.",
        variant: "destructive",
      })
      return
    }

    try {
      await addToCart(product.id, 1)
      // Refresh recommendations cache on major user activity
      if (user) {
        clearRecommendationCache()
        refreshRecommendations(user.id).catch(console.error)
      }
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      })
    } catch (error) {
      console.error("[ProductGrid] Failed to add to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      })
    }
  }

  const handleAddToFavorites = async (product: Product) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add favourites.",
        variant: "destructive",
      })
      return
    }

    try {
      await addToFavorites(product.id)
      // Refresh recommendations cache on major user activity
      if (user) {
        clearRecommendationCache()
        refreshRecommendations(user.id).catch(console.error)
      }
      toast({
        title: "Added to favourites",
        description: `${product.name} has been added to your favourites.`,
      })
    } catch (error) {
      console.error("[ProductGrid] Failed to add to favourites:", error)
      toast({
        title: "Error",
        description: "Failed to add to favourites (it may already be in your favourites).",
        variant: "destructive",
      })
    }
  }

  // Check scroll position
  const checkScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    const hasOverflow = scrollWidth > clientWidth + 5
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(hasOverflow && scrollLeft < scrollWidth - clientWidth - 10)
    console.log('[Scroll]', { scrollWidth, clientWidth, hasOverflow, left: scrollLeft > 10, right: hasOverflow && scrollLeft < scrollWidth - clientWidth - 10 })
  }, [])

  // Scroll handler
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8
    const scrollTo = direction === 'left'
      ? scrollContainerRef.current.scrollLeft - scrollAmount
      : scrollContainerRef.current.scrollLeft + scrollAmount

    scrollContainerRef.current.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    })
  }

  // Update scroll state when products change
  useEffect(() => {
    const timer = setTimeout(() => checkScroll(), 200)
    return () => clearTimeout(timer)
  }, [products, checkScroll])

  // Add resize listener
  useEffect(() => {
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll])

  // Mark some products as bestsellers randomly
  const bestsellers = new Set([0, 3, 5, 8].map((i) => products[i]?.id).filter(Boolean))

  // Products for the grid (exclude highlighted product so it only appears at the top section)
  const gridProducts = highlightedProduct
    ? products.filter((p) => p.id !== highlightedProduct.id)
    : products

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Filter Sidebar */}
      <FilterSidebar selectedCategory={selectedCategory} />

      {/* Products Section */}
      <div className="flex-1 min-w-0 mr-2">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="text-sm text-muted-foreground">
            {selectedCategory ? (
              <>
                Showing <span className="font-medium text-foreground">{products.length.toLocaleString()}</span> of{" "}
                <span className="font-medium text-foreground">{total.toLocaleString()}</span> products in{" "}
                <span className="font-medium text-primary capitalize">{selectedCategory}</span>
                {(minPrice || maxPrice || minRating) && (
                  <span className="ml-2">
                    {minPrice && ` • Min: ₹${minPrice}`}
                    {maxPrice && ` • Max: ₹${maxPrice}`}
                    {minRating && ` • Rating: ${minRating}+`}
                  </span>
                )}
              </>
            ) : (
              <>
                Showing <span className="font-medium text-foreground">{products.length.toLocaleString()}</span> of{" "}
                <span className="font-medium text-foreground">{total.toLocaleString()}</span> Products
                {(minPrice || maxPrice || minRating) && (
                  <span className="ml-2">
                    {minPrice && ` • Min: ₹${minPrice}`}
                    {maxPrice && ` • Max: ₹${maxPrice}`}
                    {minRating && ` • Rating: ${minRating}+`}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Sort:{" "}
                  {sortBy === "price_low"
                    ? "Price: Low to High"
                    : sortBy === "price_high"
                      ? "Price: High to Low"
                      : "Default"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSortChange("default")}>Default</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("price_low")}>Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("price_high")}>Price: High to Low</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 border border-border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading products...</span>
          </div>
        ) : (
          <>
            {/* Highlighted product at the top when a product is clicked / highlighted */}
            {highlightedProduct && (
              <div className="mb-8 p-0 border border-border/50 rounded-xl bg-gradient-to-br from-card to-secondary/10 shadow-lg overflow-hidden max-w-5xl mx-auto group animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col md:flex-row">
                  {/* Image Section */}
                  <div className="w-full md:w-1/3 lg:w-1/4 bg-white p-6 flex items-center justify-center relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-50" />

                    <img
                      src={highlightedProduct.image || "/placeholder.svg"}
                      alt={highlightedProduct.name}
                      className="relative z-10 max-h-64 object-contain w-full hover:scale-110 transition-transform duration-500 ease-out"
                    />
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                          {highlightedProduct.sub_category}
                        </span>
                        {highlightedProduct.ratings && (
                          <div className="flex items-center gap-1 text-warning text-sm">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{Math.round(Number(highlightedProduct.ratings) * 10) / 10}</span>
                          </div>
                        )}
                      </div>

                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 leading-tight">
                        {highlightedProduct.name}
                      </h2>

                      <div className="flex items-end gap-3 mb-4">
                        <p className="text-2xl md:text-4xl font-bold text-primary">
                          {highlightedProduct.discount_price || highlightedProduct.actual_price}
                        </p>
                        {highlightedProduct.actual_price &&
                          highlightedProduct.discount_price &&
                          highlightedProduct.discount_price !== highlightedProduct.actual_price && (
                            <p className="text-base md:text-lg text-muted-foreground mb-1.5">
                              <span className="line-through">{highlightedProduct.actual_price}</span>
                              <span className="ml-2 text-success font-medium text-sm">
                                {Math.round(((Number(highlightedProduct.actual_price.replace(/[^0-9]/g, "")) - Number(highlightedProduct.discount_price.replace(/[^0-9]/g, ""))) / Number(highlightedProduct.actual_price.replace(/[^0-9]/g, ""))) * 100)}% Off
                              </span>
                            </p>
                          )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
                      <Button
                        size="lg"
                        className="flex-1 text-base font-semibold shadow-md hover:shadow-xl transition-all"
                        onClick={() => handleBuyNow(highlightedProduct)}
                      >
                        Buy Now
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 text-base border-primary/20 hover:bg-primary/5"
                        onClick={() => handleAddToCart(highlightedProduct)}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-full border border-border bg-background/50 hover:bg-background hover:text-red-500 hover:border-red-200 transition-colors"
                        onClick={() => handleAddToFavorites(highlightedProduct)}
                      >
                        <Heart className="h-5 w-5" />
                        <span className="sr-only">Favorite</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Grid with Recommendations Interleaved */}
            <div id="products-grid-section" className="flex flex-col gap-8 pb-12">
              {(() => {
                // Chunk items into groups of 12 (approx 3 rows on large screens)
                const chunkSize = 12;
                const chunks = [];
                for (let i = 0; i < gridProducts.length; i += chunkSize) {
                  chunks.push(gridProducts.slice(i, i + chunkSize));
                }

                if (chunks.length === 0) return null;

                return chunks.map((chunk, chunkIndex) => (
                  <Fragment key={chunkIndex}>
                    <div className="relative group/section">
                      {/* Scroll buttons */}
                      {canScrollLeft && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-background/95 hover:bg-background shadow-xl border border-border/50 text-foreground/70 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 hidden md:flex"
                          onClick={() => scroll('left')}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                      )}
                      {canScrollRight && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-background/95 hover:bg-background shadow-xl border border-border/50 text-foreground/70 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 hidden md:flex"
                          onClick={() => scroll('right')}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      )}

                      <div
                        ref={scrollContainerRef}
                        className={
                          viewMode === "grid"
                            ? "overflow-x-auto overflow-y-hidden scrollbar-hide py-2"
                            : "flex flex-col gap-4"
                        }
                        style={viewMode === "grid" ? {
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          WebkitOverflowScrolling: 'touch',
                          scrollSnapType: 'x mandatory',
                        } : undefined}
                        onScroll={checkScroll}
                      >
                        <div
                          className={
                            viewMode === "grid"
                              ? "flex gap-3"
                              : "flex flex-col gap-4"
                          }
                          style={viewMode === "grid" ? {
                            minWidth: 'max-content'
                          } : undefined}
                        >
                          {chunk.map((product) => (
                            <div key={product.id} className="flex-shrink-0 w-36 sm:w-40 md:w-44 scroll-snap-align-start">
                              <ProductCard
                                product={product}
                                compact={true}
                                isBestseller={bestsellers.has(product.id)}
                                onClick={handleProductClick}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Show Recommendation Row after first chunk only - consistent across all categories */}
                    {/* Show once at the top to avoid repetition */}
                    {recommendations.length > 0 && chunkIndex === 0 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <RecommendationRow
                          products={recommendations}
                        />
                      </div>
                    )}

                    {/* Show cluster recommendations if a product was clicked */}
                    {showClusterRecs && clusterRecommendations.length > 0 && chunkIndex === 0 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 mt-4">
                        <div className="py-6 my-4 border-y border-border/50 bg-secondary/5 rounded-xl px-4 md:px-6">
                          <h3 className="text-xl font-semibold text-foreground mb-4">
                            Similar Products
                          </h3>
                          <div className="flex flex-wrap gap-3 justify-start">
                            {clusterRecommendations.slice(0, 6).map((product) => (
                              <div key={product.id} className="flex-shrink-0 w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] md:w-36 lg:w-40">
                                <ProductCard product={product} compact={true} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Fragment>
                ));
              })()}
            </div>

            {products.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found.</p>
              </div>
            )}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerTarget} className="flex justify-center py-8">
                {isLoadingMore && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading more products...</span>
                  </div>
                )}
              </div>
            )}

            {!hasMore && products.length > 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">All products loaded</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
