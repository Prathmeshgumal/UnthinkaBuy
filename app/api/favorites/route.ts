import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api-config"

// GET - Get user's favorites
export async function GET(request: NextRequest) {
  const backendUrl = getBackendUrl()
  const apiUrl = backendUrl ? `${backendUrl}/api/favorites` : `/api/favorites`

  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[Favorites API] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    )
  }
}


