/**
 * Fetch products from a specific cluster
 */

import type { Product } from "./types"
import { getBackendUrl } from "./api-config"

export async function fetchProductsByCluster(clusterId: number): Promise<Product[]> {
  try {
    const backendUrl = getBackendUrl()
    const apiUrl = backendUrl 
      ? `${backendUrl}/api/random-cluster-products`
      : `http://localhost:8000/api/random-cluster-products`
    
    // Fetch all cluster products and filter by cluster_id
    const response = await fetch(apiUrl, {
      cache: "no-store",
    })
    
    if (!response.ok) {
      console.error(`[ClusterProducts] API error: ${response.status}`)
      return []
    }
    
    const data = await response.json()
    
    // Find the cluster in the response
    const cluster = data.clusters?.find((c: any) => c.id === clusterId)
    if (!cluster || !cluster.product_ids || cluster.product_ids.length === 0) {
      return []
    }
    
    // Fetch product details using by-ids endpoint
    const productIds = cluster.product_ids.slice(0, 20)
    const idsParam = productIds.join(",")
    const productsResponse = await fetch(`/api/products/by-ids?productIds=${idsParam}`)
    
    if (!productsResponse.ok) {
      return []
    }
    
    const productsData = await productsResponse.json()
    return (Array.isArray(productsData) ? productsData : productsData.products || []) as Product[]
  } catch (error) {
    console.error("[ClusterProducts] Error fetching cluster products:", error)
    return []
  }
}

