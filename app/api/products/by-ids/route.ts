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
      console.error("[Products by IDs] Supabase client not available")
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

    // Limit batch size to avoid query limits (Supabase typically handles up to 1000 items)
    const MAX_BATCH_SIZE = 500
    let allProducts: any[] = []

    // Process in batches if needed
    for (let i = 0; i < ids.length; i += MAX_BATCH_SIZE) {
      const batch = ids.slice(i, i + MAX_BATCH_SIZE)
      
      // Fetch products by IDs
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", batch)

      if (error) {
        console.error(`[Products by IDs] Error fetching batch ${i}-${i + batch.length}:`, error)
        continue // Skip this batch but continue with others
      }

      if (data) {
        allProducts.push(...data)
      }
    }

    // Preserve the order of IDs
    const productsMap = new Map(allProducts.map((p) => [p.id, p]))
    const orderedProducts = ids
      .map((id) => productsMap.get(id))
      .filter((p) => p !== undefined)

    console.log(`[Products by IDs] Fetched ${orderedProducts.length} products from ${ids.length} requested IDs`)
    return NextResponse.json(orderedProducts)
  } catch (error) {
    console.error("[Products by IDs] Unexpected error:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      console.error("[Products by IDs] Supabase client not available")
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ products: [] }, { status: 200 })
    }

    // Limit batch size to avoid query limits (Supabase typically handles up to 1000 items)
    const MAX_BATCH_SIZE = 500
    let allProducts: any[] = []

    // Process in batches if needed
    for (let i = 0; i < ids.length; i += MAX_BATCH_SIZE) {
      const batch = ids.slice(i, i + MAX_BATCH_SIZE)
      
      // Fetch products by IDs
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", batch)

      if (error) {
        console.error(`[Products by IDs] Error fetching batch ${i}-${i + batch.length}:`, error)
        continue // Skip this batch but continue with others
      }

      if (data) {
        allProducts.push(...data)
      }
    }

    // Preserve the order of IDs
    const productsMap = new Map(allProducts.map((p) => [p.id, p]))
    const orderedProducts = ids
      .map((id) => productsMap.get(id))
      .filter((p) => p !== undefined)

    console.log(`[Products by IDs] POST: Fetched ${orderedProducts.length} products from ${ids.length} requested IDs`)
    return NextResponse.json({ products: orderedProducts })
  } catch (error) {
    console.error("[Products by IDs] POST Unexpected error:", error)
    return NextResponse.json({ products: [] }, { status: 200 })
  }
}

