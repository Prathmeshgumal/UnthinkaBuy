"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
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
import { useRouter } from "next/navigation"

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

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<Product[]>([])
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

  // Mark some products as bestsellers randomly
  const bestsellers = new Set([0, 3, 5, 8].map((i) => products[i]?.id).filter(Boolean))

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
            {/* Product Grid */}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "flex flex-col gap-4"
              }
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} isBestseller={bestsellers.has(product.id)} />
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
