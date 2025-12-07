"use client"

import { Suspense } from "react"
import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { FeaturedProducts } from "@/components/featured-products"
import { DiscountedProducts } from "@/components/discounted-products"
import { GloballyLovedProducts } from "@/components/globally-loved-products"
import { RandomClusterProducts } from "@/components/random-cluster-products"
import { Footer } from "@/components/footer"
import { useSearchParams } from "next/navigation"

function HomeContent() {
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category")
  const maxPrice = searchParams.get("max_price")
  const minRating = searchParams.get("min_rating")
  
  // Show products section if category is selected OR filters are applied
  const showProductsSection = selectedCategory || maxPrice || minRating

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Products Section - Show when category is selected or filters are applied */}
        {showProductsSection ? (
        <section id="products-section" className="container mx-auto px-4 py-8">
          <ProductGrid />
        </section>
        ) : (
          <div className="space-y-0">
            {/* Globally loved strip at the very top - full width */}
            <div className="bg-gradient-to-r from-blue-50 via-white to-red-50 dark:from-blue-950 dark:via-background dark:to-red-950 py-4">
              <GloballyLovedProducts />
            </div>

            {/* You may also like (random clusters) - denser layout */}
            <div className="bg-background">
              <RandomClusterProducts />
            </div>

            {/* Best Deals Under ₹499 section - highlighted */}
            <div className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-950 dark:to-background py-6">
              <DiscountedProducts />
            </div>

            {/* Featured categories - clean background */}
            <div className="bg-background py-4">
              <FeaturedProducts />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
