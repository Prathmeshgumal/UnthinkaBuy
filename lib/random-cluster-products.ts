import type { Product } from "./types"

export interface ClusterInfo {
  id: number
  title: string
  description: string
  product_ids: string[]
  total_products?: number
  has_more?: boolean
  offset?: number
  limit?: number
}

export interface RandomClusterProductsResponse {
  cluster_products: Record<string, string[]>
  clusters: ClusterInfo[]
}

export async function fetchRandomClusterProducts(): Promise<RandomClusterProductsResponse> {
  const response = await fetch(`/api/random-cluster-products`)
  if (!response.ok) {
    throw new Error("Failed to fetch random cluster products")
  }
  return response.json()
}

export async function fetchProductsByIds(productIds: string[]): Promise<Product[]> {
  if (productIds.length === 0) {
    return []
  }

  // Use POST for large batches to avoid URL length limits
  // URLs typically have a 2048 character limit, so use POST if we have more than 50 IDs
  // or if the estimated URL length would be too long
  const usePost = productIds.length > 50 || (productIds.join(",").length > 1500)

  try {
    let response: Response
    let data: any

    if (usePost) {
      // Use POST for large batches
      response = await fetch(`/api/products/by-ids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: productIds }),
      })

      if (!response.ok) {
        console.error(`[fetchProductsByIds] POST failed with status ${response.status}`)
        // Try to get error details
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`[fetchProductsByIds] Error details:`, errorText)
        return [] // Return empty array instead of throwing
      }

      data = await response.json()
      return (data.products || []) as Product[]
    } else {
      // Use GET for small batches
      const idsParam = productIds.join(",")
      response = await fetch(`/api/products/by-ids?productIds=${idsParam}`)

      if (!response.ok) {
        console.error(`[fetchProductsByIds] GET failed with status ${response.status}`)
        // Try to get error details
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`[fetchProductsByIds] Error details:`, errorText)
        return [] // Return empty array instead of throwing
      }

      data = await response.json()
      // API can return either a bare array (GET handler) or { products: [...] } (POST handler)
      if (Array.isArray(data)) {
        return data as Product[]
      }
      return (data.products || []) as Product[]
    }
  } catch (error) {
    console.error("[fetchProductsByIds] Network error:", error)
    // Return empty array instead of throwing to prevent breaking the UI
    return []
  }
}

