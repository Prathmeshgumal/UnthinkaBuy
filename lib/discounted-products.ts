import type { Product } from "./types"

export interface DiscountedProductsResponse {
  product_ids: string[]
}

export async function fetchDiscountedProducts(): Promise<DiscountedProductsResponse> {
  try {
    const response = await fetch("/api/discounted-products")
    
    if (!response.ok) {
      console.error("[Discounted Products] API error:", response.statusText)
      return { product_ids: [] }
    }

    const data = await response.json()
    return data as DiscountedProductsResponse
  } catch (error) {
    console.error("[Discounted Products] Error fetching discounted products:", error)
    return { product_ids: [] }
  }
}

export async function fetchDiscountedProductsByIds(productIds: string[]): Promise<Product[]> {
  if (productIds.length === 0) return []

  try {
    const response = await fetch("/api/products/by-ids", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: productIds }),
    })

    if (!response.ok) {
      console.error("[Discounted Products] Error fetching products by IDs:", response.statusText)
      return []
    }

    const data = await response.json()
    return (data.products || []) as Product[]
  } catch (error) {
    console.error("[Discounted Products] Error fetching products by IDs:", error)
    return []
  }
}

