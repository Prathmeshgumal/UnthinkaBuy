import { NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api-config"

export async function GET() {
  const backendUrl = getBackendUrl()
  
  // If backendUrl is empty, use relative path (Vercel serverless functions)
  const apiUrl = backendUrl 
    ? `${backendUrl}/api/random-cluster-products`
    : `/api/random-cluster-products`
  
  console.log("[Random Cluster Products] Fetching from:", apiUrl)

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Don't cache - we want random products each time
    })

    if (!response.ok) {
      console.error("[Random Cluster Products] FastAPI backend error:", response.status, response.statusText)
      const errorText = await response.text().catch(() => "Unknown error")
      console.error("[Random Cluster Products] Error details:", errorText)
      return NextResponse.json({ cluster_products: {}, clusters: [] }, { status: 200 })
    }

    const data = await response.json()
    console.log("[Random Cluster Products] Successfully fetched", data.clusters?.length || 0, "clusters")
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Random Cluster Products] Error fetching from FastAPI backend:", error.message || error)
    return NextResponse.json(
      { cluster_products: {}, clusters: [], error: "Failed to connect to backend" },
      { status: 200 }
    )
  }
}

