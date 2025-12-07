import { type NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  const backendUrl = getBackendUrl()
  
  if (!backendUrl) {
    console.error("[Auth API] Backend URL not configured. Set NEXT_PUBLIC_FASTAPI_URL environment variable.")
    return NextResponse.json(
      { error: "Authentication server not configured. Please contact support." },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()

    // Proxy request to FastAPI backend
    const response = await fetch(`${backendUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Auth API] Signup error:", error.message || error)
    return NextResponse.json(
      { error: "Failed to connect to authentication server. Please try again later." },
      { status: 503 }
    )
  }
}
