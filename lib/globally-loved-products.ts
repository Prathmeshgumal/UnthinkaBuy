export interface GloballyLovedProductsResponse {
  product_ids: string[]
}

export async function fetchGloballyLovedProducts(): Promise<GloballyLovedProductsResponse> {
  const response = await fetch("/api/globally-loved-products")
  if (!response.ok) {
    throw new Error("Failed to fetch globally loved products")
  }
  return response.json()
}

export async function fetchGloballyLovedProductsByIds(
  productIds: string[]
): Promise<any[]> {
  if (productIds.length === 0) {
    return []
  }

  const idsParam = productIds.join(",")
  const response = await fetch(`/api/products/by-ids?productIds=${idsParam}`)
  if (!response.ok) {
    throw new Error("Failed to fetch product details")
  }
  return response.json()
}

