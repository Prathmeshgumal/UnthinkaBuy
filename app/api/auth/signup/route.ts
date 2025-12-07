import { type NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  const backendUrl = getBackendUrl()
  
  // If backendUrl is empty, use relative path (Vercel serverless functions)
  const apiUrl = backendUrl 
    ? `${backendUrl}/api/auth/signup`
    : `/api/auth/signup`

  try {
    const body = await request.json()

    // Proxy request to FastAPI backend
    const response = await fetch(apiUrl, {
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
