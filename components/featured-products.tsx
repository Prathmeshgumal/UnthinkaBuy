"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchFeaturedProducts, fetchProductsByIds, type FeaturedCategory } from "@/lib/featured-products"
import { ProductCard } from "@/components/product-card"
import { Loader2 } from "lucide-react"
import type { Product } from "@/lib/types"

export function FeaturedProducts() {
  const router = useRouter()
  const [featuredCategories, setFeaturedCategories] = useState<FeaturedCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleProductClick = (product: Product) => {
    // Navigate to the product's main_category
    router.push(`/?category=${encodeURIComponent(product.main_category)}`)
    // Scroll to products section after navigation
    setTimeout(() => {
      const productsSection = document.getElementById("products-section")
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  useEffect(() => {
    async function loadFeaturedProducts() {
      setIsLoading(true)
      try {
        // Step 1: Fetch featured product IDs grouped by sub_category
        const featuredData = await fetchFeaturedProducts()
        
        if (!featuredData.featured_products || Object.keys(featuredData.featured_products).length === 0) {
          setFeaturedCategories([])
          setIsLoading(false)
          return
        }

        // Step 2: Collect all product IDs and fetch them
        const allProductIds: string[] = []
        const subCategoryToIds: Record<string, string[]> = {}

        for (const [subCategory, productIds] of Object.entries(featuredData.featured_products)) {
          subCategoryToIds[subCategory] = productIds
          allProductIds.push(...productIds)
        }

        // Step 3: Fetch all products by IDs
        const products = await fetchProductsByIds(allProductIds)

        // Step 4: Group products by sub_category
        const productsMap = new Map<string, Product>()
        products.forEach((product) => {
          productsMap.set(product.id, product)
        })

        const categories: FeaturedCategory[] = []
        for (const [subCategory, productIds] of Object.entries(subCategoryToIds)) {
          const categoryProducts = productIds
            .map((id) => productsMap.get(id))
            .filter((p): p is Product => p !== undefined)

          if (categoryProducts.length > 0) {
            categories.push({
              sub_category: subCategory,
              products: categoryProducts,
            })
          }
        }

        setFeaturedCategories(categories)
        console.log("[FeaturedProducts] Loaded", categories.length, "featured categories")
      } catch (error) {
        console.error("[FeaturedProducts] Failed to load featured products:", error)
        setFeaturedCategories([])
      } finally {
        setIsLoading(false)
      }
    }

    loadFeaturedProducts()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading featured products...</span>
      </div>
    )
  }

  if (featuredCategories.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">No featured products available at the moment.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Top Rated Categories
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Best products from trending categories
        </p>
      </div>
      {/* Grid layout: 2 categories side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featuredCategories.map((category) => (
          <section key={category.sub_category} className="space-y-2 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background p-4 rounded-xl border border-blue-100 dark:border-blue-900">
            <h3 className="text-base md:text-lg font-semibold capitalize text-blue-700 dark:text-blue-300">
              {category.sub_category}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {category.products.slice(0, 2).map((product) => (
                <div
                  key={product.id}
                  onClick={(e) => {
                    // Don't redirect if clicking on buttons or links
                    const target = e.target as HTMLElement
                    if (
                      target.tagName === "BUTTON" ||
                      target.closest("button") ||
                      target.tagName === "A" ||
                      target.closest("a")
                    ) {
                      return
                    }
                    handleProductClick(product)
                  }}
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                >
                  <ProductCard product={product} compact={true} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

