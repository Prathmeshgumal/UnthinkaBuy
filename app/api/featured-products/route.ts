import { NextResponse } from "next/server"
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

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      console.error("[Featured Products] Supabase client not available")
      return NextResponse.json({ featured_products: {} }, { status: 200 })
    }

    // Fetch all products to analyze
    const allProducts: any[] = []
    let page = 0
    const pageSize = 10000
    let hasMore = true

    while (hasMore) {
      const offset = page * pageSize
      const { data, error } = await supabase
        .from("products")
        .select("id, sub_category, no_of_ratings, ratings")
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error(`[Featured Products] Error at page ${page}:`, error.message)
        break
      }

      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      allProducts.push(...data)

      if (data.length < pageSize) {
        hasMore = false
      } else {
        page++
      }

      // Safety limit
      if (page >= 50) {
        break
      }
    }

    // Calculate total buys (no_of_ratings) per sub_category
    const subcategoryBuys: Record<string, number> = {}
    for (const product of allProducts) {
      const subCat = product.sub_category
      if (!subCat) continue

      // Parse no_of_ratings to get number of buys
      const ratingsStr = product.no_of_ratings || "0"
      // Extract numeric value from string (e.g., "78,970" -> 78970)
      let numBuys = 0
      try {
        numBuys = parseInt(ratingsStr.replace(/[^0-9]/g, "")) || 0
      } catch {
        numBuys = 0
      }

      if (!subcategoryBuys[subCat]) {
        subcategoryBuys[subCat] = 0
      }
      subcategoryBuys[subCat] += numBuys
    }

    // Get top 4 sub_categories by total buys
    const topSubcategories = Object.entries(subcategoryBuys)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    // For each top sub_category, find top 5 products by rating
    const resultData: Record<string, string[]> = {}

    for (const [subCategory] of topSubcategories) {
      // Filter products for this sub_category
      const categoryProducts = allProducts.filter(
        (p) => p.sub_category === subCategory && p.ratings
      )

      // Sort by rating (descending) and get top 2
      const sortedProducts = categoryProducts
        .map((p) => ({
          id: p.id,
          rating: parseFloat(p.ratings || "0") || 0,
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 2)

      // Extract product IDs
      const productIds = sortedProducts.map((p) => p.id)
      if (productIds.length > 0) {
        resultData[subCategory] = productIds
      }
    }

    return NextResponse.json({ featured_products: resultData })
  } catch (error) {
    console.error("[Featured Products] Error:", error)
    return NextResponse.json({ featured_products: {} }, { status: 200 })
  }
}

