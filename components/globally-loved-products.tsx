"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchGloballyLovedProducts, fetchGloballyLovedProductsByIds } from "@/lib/globally-loved-products"
import { ProductCard } from "@/components/product-card"
import { Loader2 } from "lucide-react"
import type { Product } from "@/lib/types"

export function GloballyLovedProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
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
    async function loadGloballyLovedProducts() {
      setIsLoading(true)
      try {
        // Step 1: Fetch globally loved product IDs
        const data = await fetchGloballyLovedProducts()
        
        if (!data.product_ids || data.product_ids.length === 0) {
          setProducts([])
          setIsLoading(false)
          return
        }

        // Step 2: Fetch product details
        const productDetails = await fetchGloballyLovedProductsByIds(data.product_ids)
        setProducts(productDetails)
        console.log("[GloballyLovedProducts] Loaded", productDetails.length, "globally loved products")
      } catch (error) {
        console.error("[GloballyLovedProducts] Failed to load products:", error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadGloballyLovedProducts()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground text-sm">Loading globally loved products...</span>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  // Duplicate products for seamless loop
  const duplicatedProducts = [...products, ...products]

  return (
    <section className="w-full py-4">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Globally Loved Products
        </h2>
        <div className="relative overflow-hidden scroll-products-container rounded-lg">
          <div className="flex gap-3 animate-scroll-products-horizontal py-2">
            {duplicatedProducts.map((product, index) => (
              <div
                key={`${product.id}-${index}`}
                className="flex-shrink-0 w-36 sm:w-40 md:w-44 cursor-pointer transition-transform duration-200 hover:scale-105"
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
              >
                <ProductCard product={product} compact={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

