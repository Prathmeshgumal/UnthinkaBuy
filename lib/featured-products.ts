import type { Product } from "./types"

export interface FeaturedProductsResponse {
  featured_products: Record<string, string[]> // sub_category -> product IDs
}

export async function fetchFeaturedProducts(): Promise<FeaturedProductsResponse> {
  try {
    const response = await fetch("/api/featured-products")
    
    if (!response.ok) {
      console.error("[Featured Products] API error:", response.statusText)
      return { featured_products: {} }
    }

    const data = await response.json()
    return data as FeaturedProductsResponse
  } catch (error) {
    console.error("[Featured Products] Error fetching featured products:", error)
    return { featured_products: {} }
  }
}

export async function fetchProductsByIds(productIds: string[]): Promise<Product[]> {
  if (productIds.length === 0) return []

  try {
    // Fetch products from Supabase by IDs
    const response = await fetch("/api/products/by-ids", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: productIds }),
    })

    if (!response.ok) {
      console.error("[Featured Products] Error fetching products by IDs:", response.statusText)
      return []
    }

    const data = await response.json()
    return (data.products || []) as Product[]
  } catch (error) {
    console.error("[Featured Products] Error fetching products by IDs:", error)
    return []
  }
}

export interface FeaturedCategory {
  sub_category: string
  products: Product[]
}

