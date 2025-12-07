import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all products
    const allProducts: any[] = []
    let page = 0
    const pageSize = 10000
    let hasMore = true

    while (hasMore) {
      const offset = page * pageSize
      const { data, error } = await supabase
        .from("products")
        .select("id, no_of_ratings, ratings")
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error("[Globally Loved Products] Error fetching products:", error)
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

    // Calculate popularity score for each product
    // Score = (buys * 0.6) + (no_of_ratings * 0.4)
    // Using no_of_ratings as proxy for both buys and no_of_ratings
    const scoredProducts = allProducts.map((product) => {
      // Parse no_of_ratings (used as proxy for buys)
      const buysStr = product.no_of_ratings || "0"
      const buys = parseInt(buysStr.toString().replace(/,/g, ""), 10) || 0

      // Parse no_of_ratings
      const ratingsCountStr = product.no_of_ratings || "0"
      const ratingsCount = parseInt(ratingsCountStr.toString().replace(/,/g, ""), 10) || 0

      // Calculate weighted score: 60% buys, 40% no_of_ratings
      const score = buys * 0.6 + ratingsCount * 0.4

      return {
        id: product.id,
        score: score,
      }
    })

    // Sort by score descending and get top 20
    scoredProducts.sort((a, b) => b.score - a.score)
    const top20Ids = scoredProducts.slice(0, 20).map((p) => p.id)

    return NextResponse.json({ product_ids: top20Ids })
  } catch (error) {
    console.error("[Globally Loved Products] Error:", error)
    return NextResponse.json({ product_ids: [] }, { status: 500 })
  }
}

