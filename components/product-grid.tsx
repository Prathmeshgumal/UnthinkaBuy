"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ProductCard } from "./product-card"
import { FilterSidebar } from "./filter-sidebar"
import { fetchProductsFromSupabase } from "@/lib/products-data"
import type { Product } from "@/lib/types"
import { Grid3X3, LayoutList, Loader2, ChevronDown } from "lucide-react"
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

  const handleProductClick = (product: Product) => {
    // Highlight the clicked product at the top
    setHighlightedProduct(product)

    // Update URL with highlight param (keeps back/forward navigation consistent)
    const params = new URLSearchParams(searchParams.toString())
    params.set("highlight", product.id)
    router.push(`/?${params.toString()}`)
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

  // Mark some products as bestsellers randomly
  const bestsellers = new Set([0, 3, 5, 8].map((i) => products[i]?.id).filter(Boolean))

  // Products for the grid (exclude highlighted product so it only appears at the top section)
  const gridProducts = highlightedProduct
    ? products.filter((p) => p.id !== highlightedProduct.id)
    : products

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Filter Sidebar */}
      <FilterSidebar selectedCategory={selectedCategory} />

      {/* Products Section */}
      <div className="flex-1">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
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
              <div className="mb-8 p-6 border border-primary/30 rounded-2xl bg-primary/5 flex flex-col md:flex-row gap-6 shadow-sm">
                <div className="w-full md:w-2/5 flex items-center justify-center bg-background rounded-xl p-6">
                  <img
                    src={highlightedProduct.image || "/placeholder.svg"}
                    alt={highlightedProduct.name}
                    className="max-h-64 object-contain"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-1">
                      {highlightedProduct.main_category} • {highlightedProduct.sub_category}
                    </p>
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
                      {highlightedProduct.name}
                    </h2>
                    <p className="text-lg md:text-2xl font-bold text-primary">
                      {highlightedProduct.discount_price || highlightedProduct.actual_price}
                    </p>
                    {highlightedProduct.actual_price &&
                      highlightedProduct.discount_price &&
                      highlightedProduct.discount_price !== highlightedProduct.actual_price && (
                        <p className="text-sm text-muted-foreground">
                          <span className="line-through mr-2">{highlightedProduct.actual_price}</span>
                        </p>
                      )}
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <Button
                      className="flex-1 min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90"
                      size="lg"
                      onClick={() => handleBuyNow(highlightedProduct)}
                    >
                      Buy Now
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[140px]"
                      size="lg"
                      onClick={() => handleAddToCart(highlightedProduct)}
                    >
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[140px]"
                      size="lg"
                      onClick={() => handleAddToFavorites(highlightedProduct)}
                    >
                      Add to Favourites
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 min-w-[140px]"
                      size="lg"
                      onClick={() => {
                        const params = new URLSearchParams()
                        params.set("productId", highlightedProduct.id)
                        router.push(`/review?${params.toString()}`)
                      }}
                    >
                      Add Review
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Product Grid */}
            <div
              id="products-grid-section"
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "flex flex-col gap-4"
              }
            >
              {gridProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isBestseller={bestsellers.has(product.id)}
                  onClick={handleProductClick}
                />
              ))}
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
