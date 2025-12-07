import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api-config"

// GET - Get user's cart
export async function GET(request: NextRequest) {
  const backendUrl = getBackendUrl()
  const apiUrl = backendUrl ? `${backendUrl}/api/cart` : `/api/cart`

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
    console.error("[Cart API] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    )
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  const backendUrl = getBackendUrl()
  const apiUrl = backendUrl ? `${backendUrl}/api/cart` : `/api/cart`

  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { detail: errorText || "Unknown error" }
      }
      console.error("[Cart API] Backend error:", errorData)
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Cart API] Error:", error)
    return NextResponse.json(
      { error: "Failed to add to cart", detail: error.message || String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Clear cart
export async function DELETE(request: NextRequest) {
  const backendUrl = getBackendUrl()
  const apiUrl = backendUrl ? `${backendUrl}/api/cart` : `/api/cart`

  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = await fetch(apiUrl, {
      method: "DELETE",
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
    console.error("[Cart API] Error:", error)
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    )
  }
}

