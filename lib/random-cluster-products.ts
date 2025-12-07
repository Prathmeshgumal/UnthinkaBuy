import type { Product } from "./types"

export interface ClusterInfo {
  id: number
  title: string
  description: string
  product_ids: string[]
}

export interface RandomClusterProductsResponse {
  cluster_products: Record<string, string[]>
  clusters: ClusterInfo[]
}

export async function fetchRandomClusterProducts(): Promise<RandomClusterProductsResponse> {
  const response = await fetch("/api/random-cluster-products")
  if (!response.ok) {
    throw new Error("Failed to fetch random cluster products")
  }
  return response.json()
}

export async function fetchProductsByIds(productIds: string[]): Promise<Product[]> {
  if (productIds.length === 0) {
    return []
  }

  const idsParam = productIds.join(",")
  const response = await fetch(`/api/products/by-ids?productIds=${idsParam}`)
  if (!response.ok) {
    throw new Error("Failed to fetch product details")
  }
  const data = await response.json()

  // API can return either a bare array (GET handler) or { products: [...] } (POST handler)
  if (Array.isArray(data)) {
    return data as Product[]
  }

  return (data.products || []) as Product[]
}

