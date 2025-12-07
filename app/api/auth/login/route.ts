import { type NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy request to FastAPI backend
    const response = await fetch(`${getBackendUrl()}/api/auth/login`, {
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
    console.error("[Auth API] Login error:", error)
    return NextResponse.json(
      { error: "Failed to connect to authentication server" },
      { status: 500 }
    )
  }
}
