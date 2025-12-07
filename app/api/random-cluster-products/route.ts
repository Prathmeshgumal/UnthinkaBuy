import { NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api-config"

export async function GET() {
  console.log("[Random Cluster Products] Fetching from:", `${getBackendUrl()}/api/random-cluster-products`)

  try {
    const response = await fetch(`${getBackendUrl()}/api/random-cluster-products`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Don't cache - we want random products each time
    })

    if (!response.ok) {
      console.error("[Random Cluster Products] FastAPI backend error:", response.statusText)
      return NextResponse.json({ cluster_products: {}, clusters: [] }, { status: 200 })
    }

    const data = await response.json()
    console.log("[Random Cluster Products] Response:", JSON.stringify(data).substring(0, 500))
    return NextResponse.json(data)
  } catch (error) {
    console.error("[Random Cluster Products] Error fetching from FastAPI backend:", error)
    return NextResponse.json({ cluster_products: {}, clusters: [] }, { status: 200 })
  }
}

