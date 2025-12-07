import { type NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api-config"

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization")

    if (!authorization) {
      return NextResponse.json({ message: "Logged out successfully" })
    }

    const backendUrl = getBackendUrl()
    if (backendUrl) {
      // Proxy request to FastAPI backend
      try {
        await fetch(`${backendUrl}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
          },
        })
      } catch (error) {
        // Silently fail - logout should always succeed
        console.error("[Auth API] Logout backend error (ignored):", error)
      }
    }

    // Always return success for logout (even if backend fails)
    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error: any) {
    console.error("[Auth API] Logout error:", error)
    return NextResponse.json({ message: "Logged out successfully" })
  }
}
