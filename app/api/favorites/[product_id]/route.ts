import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api-config"

// POST - Add to favorites
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ product_id: string }> }
) {
    const params = await props.params;
    const backendUrl = getBackendUrl()
    const apiUrl = backendUrl 
        ? `${backendUrl}/api/favorites/${params.product_id}`
        : `/api/favorites/${params.product_id}`

    try {
        const authHeader = request.headers.get("authorization")

        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        console.log(`[Proxy] Adding favorite: ${params.product_id}`)

        const response = await fetch(apiUrl,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authHeader,
                },
            }
        )

        if (!response.ok) {
            // Try to read text if JSON fails
            const text = await response.text()
            try {
                const json = JSON.parse(text)
                console.error("[Proxy] Backend Error (JSON):", json)
                return NextResponse.json(json, { status: response.status })
            } catch {
                console.error("[Proxy] Backend Error (Text):", text)
                return NextResponse.json(
                    { error: `Backend failed: ${text}` },
                    { status: response.status }
                )
            }
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("[Favorites API] Critical Proxy Error:", error)
        return NextResponse.json(
            { error: `Proxy failed: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        )
    }
}

// DELETE - Remove from favorites
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ product_id: string }> }
) {
    const params = await props.params;
    const backendUrl = getBackendUrl()
    const apiUrl = backendUrl 
        ? `${backendUrl}/api/favorites/${params.product_id}`
        : `/api/favorites/${params.product_id}`

    try {
        const authHeader = request.headers.get("authorization")

        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const response = await fetch(apiUrl,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authHeader,
                },
            }
        )

        if (!response.ok) {
            // Try to read text if JSON fails
            const text = await response.text()
            try {
                const json = JSON.parse(text)
                return NextResponse.json(json, { status: response.status })
            } catch {
                return NextResponse.json(
                    { error: `Backend failed: ${text}` },
                    { status: response.status }
                )
            }
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("[Favorites API] Error:", error)
        return NextResponse.json(
            { error: "Failed to remove from favorites" },
            { status: 500 }
        )
    }
}

