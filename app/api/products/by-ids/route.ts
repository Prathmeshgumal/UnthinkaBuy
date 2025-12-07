import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return null
  }

  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json([], { status: 200 })
    }

    const searchParams = request.nextUrl.searchParams
    const productIds = searchParams.get("productIds")

    if (!productIds) {
      return NextResponse.json([], { status: 200 })
    }

    // Parse comma-separated IDs
    const ids = productIds.split(",").filter((id) => id.trim().length > 0)

    if (ids.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    // Fetch products by IDs
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("id", ids)

    if (error) {
      console.error("[Products by IDs] Error:", error)
      return NextResponse.json([], { status: 200 })
    }

    // Preserve the order of IDs
    const productsMap = new Map((data || []).map((p) => [p.id, p]))
    const orderedProducts = ids
      .map((id) => productsMap.get(id))
      .filter((p) => p !== undefined)

    return NextResponse.json(orderedProducts)
  } catch (error) {
    console.error("[Products by IDs] Error:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    // Fetch products by IDs
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("id", ids)

    if (error) {
      console.error("[Products by IDs] Error:", error)
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    // Preserve the order of IDs
    const productsMap = new Map((data || []).map((p) => [p.id, p]))
    const orderedProducts = ids
      .map((id) => productsMap.get(id))
      .filter((p) => p !== undefined)

    return NextResponse.json({ products: orderedProducts })
  } catch (error) {
    console.error("[Products by IDs] Error:", error)
    return NextResponse.json({ products: [] }, { status: 200 })
  }
}

