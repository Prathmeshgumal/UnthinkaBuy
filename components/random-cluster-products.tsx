"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchRandomClusterProducts, fetchProductsByIds, type ClusterInfo } from "@/lib/random-cluster-products"
import { ProductCard } from "@/components/product-card"
import { Loader2 } from "lucide-react"
import type { Product } from "@/lib/types"

interface ClusterWithProducts {
  cluster: ClusterInfo
  products: Product[]
}

export function RandomClusterProducts() {
  const router = useRouter()
  const [clustersWithProducts, setClustersWithProducts] = useState<ClusterWithProducts[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleProductClick = (product: Product) => {
    router.push(`/?category=${encodeURIComponent(product.main_category)}`)
    setTimeout(() => {
      const productsSection = document.getElementById("products-section")
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  useEffect(() => {
    async function loadClusterProducts() {
      setIsLoading(true)
      try {
        // Step 1: Fetch random cluster products
        const data = await fetchRandomClusterProducts()

        if (!data.clusters || data.clusters.length === 0) {
          setClustersWithProducts([])
          setIsLoading(false)
          return
        }

        // Step 2: Fetch product details for all clusters
        const allProductIds = data.clusters.flatMap((c) => c.product_ids)
        const allProducts = await fetchProductsByIds(allProductIds)

        // Create a map for quick product lookup
        const productMap = new Map(allProducts.map((p) => [p.id, p]))

        // Step 3: Organize products by cluster
        const clustersWithProds: ClusterWithProducts[] = data.clusters
          .map((cluster) => ({
            cluster,
            products: cluster.product_ids
              .map((id) => productMap.get(id))
              .filter((p): p is Product => p !== undefined),
          }))
          .filter((c) => c.products.length > 0)

        // Shuffle the clusters for random placement
        const shuffled = [...clustersWithProds].sort(() => Math.random() - 0.5)
        setClustersWithProducts(shuffled)

        console.log("[RandomClusterProducts] Loaded", shuffled.length, "clusters with products")
      } catch (error) {
        console.error("[RandomClusterProducts] Failed to load products:", error)
        setClustersWithProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadClusterProducts()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground text-sm">Discovering products for you...</span>
      </div>
    )
  }

  if (clustersWithProducts.length === 0) {
    return null
  }

  // Define consistent dense layout for all clusters
  const layoutStyle = "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Main heading and layout */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          You may also like
        </h2>
      </div>

      {/* Two column layout: clusters on left, image on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left side - Cluster products (takes 8 columns on large screens) */}
        <div className="lg:col-span-8 space-y-6">
          {clustersWithProducts.map((clusterData, index) => (
            <div key={clusterData.cluster.id}>
              {/* Cluster name */}
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 capitalize">
                {clusterData.cluster.title}
              </h3>

              {/* Products in horizontal scrollable row - one line per cluster */}
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-max">
                  {clusterData.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex-shrink-0 w-40 sm:w-44 md:w-48 cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                      onClick={(e) => {
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
          ))}
        </div>

        {/* Right side - Promotional image (takes 4 columns on large screens) */}
        <div className="lg:col-span-4 hidden lg:block">
          <div className="sticky top-4 rounded-2xl overflow-hidden shadow-lg h-full min-h-[600px]">
            <img
              src="/6c3c5fe2-c236-4fa2-8d97-595e1e01da01.webp"
              alt="Shop your fashion needs"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

