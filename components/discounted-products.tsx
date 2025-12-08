"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchDiscountedProducts, fetchDiscountedProductsByIds } from "@/lib/discounted-products"
import { ProductCard } from "@/components/product-card"
import { Loader2 } from "lucide-react"
import type { Product } from "@/lib/types"

export function DiscountedProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleProductClick = (product: Product) => {
    // Navigate to filtered view: price < 499 and rating > 4
    // Also highlight the specific product that was clicked
    const params = new URLSearchParams()
    params.set("max_price", "498")
    params.set("min_rating", "4.1")
    params.set("highlight", product.id)

    router.push(`/?${params.toString()}`)

    // Scroll to products section after navigation
    setTimeout(() => {
      const productsSection = document.getElementById("products-section")
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  useEffect(() => {
    async function loadDiscountedProducts() {
      setIsLoading(true)
      try {
        // Step 1: Fetch discounted product IDs
        const data = await fetchDiscountedProducts()
        
        if (!data.product_ids || data.product_ids.length === 0) {
          setProducts([])
          setIsLoading(false)
          return
        }

        // Step 2: Fetch product details
        const productDetails = await fetchDiscountedProductsByIds(data.product_ids)
        setProducts(productDetails)
        console.log("[DiscountedProducts] Loaded", productDetails.length, "discounted products")
      } catch (error) {
        console.error("[DiscountedProducts] Failed to load discounted products:", error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadDiscountedProducts()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground text-sm">Loading deals...</span>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="container mx-auto px-4">
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Best Deals Under ₹499
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Top-rated products with 4+ stars, all under ₹499
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
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
  )
}

