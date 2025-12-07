import { type NextRequest, NextResponse } from "next/server"

const FASTAPI_BACKEND_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy request to FastAPI backend
    const response = await fetch(`${FASTAPI_BACKEND_URL}/api/auth/signup`, {
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
    console.error("[Auth API] Signup error:", error)
    return NextResponse.json(
      { error: "Failed to connect to authentication server" },
      { status: 500 }
    )
  }
}
