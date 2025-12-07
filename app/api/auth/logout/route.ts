import { type NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization")

    if (!authorization) {
      return NextResponse.json({ message: "Logged out successfully" })
    }

    // Proxy request to FastAPI backend
    const response = await fetch(`${getBackendUrl()}/api/auth/logout`, {
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
