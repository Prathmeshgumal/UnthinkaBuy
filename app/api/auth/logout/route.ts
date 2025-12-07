import { type NextRequest, NextResponse } from "next/server"

const FASTAPI_BACKEND_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization")

    if (!authorization) {
      return NextResponse.json({ message: "Logged out successfully" })
    }

    // Proxy request to FastAPI backend
    const response = await fetch(`${FASTAPI_BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
    })

    // Always return success for logout (even if backend fails)
    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error: any) {
    console.error("[Auth API] Logout error:", error)
    return NextResponse.json({ message: "Logged out successfully" })
  }
}
