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
      console.error("[Discounted Products] Supabase client not available")
      return NextResponse.json({ product_ids: [] }, { status: 200 })
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
        .select("id, main_category, discount_price, ratings")
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error(`[Discounted Products] Error at page ${page}:`, error.message)
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

    // Filter products: discount_price < 499 and rating > 4
    const filteredProducts = []
    for (const product of allProducts) {
      // Parse discount_price
      const priceStr = product.discount_price || "0"
      let price = 0
      try {
        price = parseInt(priceStr.replace(/[^0-9]/g, "")) || 0
      } catch {
        price = 0
      }

      // Parse rating
      const ratingStr = product.ratings || "0"
      let rating = 0
      try {
        rating = parseFloat(ratingStr) || 0
      } catch {
        rating = 0
      }

      // Check conditions: price < 499 and rating > 4
      if (price > 0 && price < 499 && rating > 4.0) {
        filteredProducts.push(product)
      }
    }

    // Group by main_category and get one product per category
    const categoryProducts: Record<string, any[]> = {}
    for (const product of filteredProducts) {
      const mainCat = product.main_category
      if (!mainCat) continue

      if (!categoryProducts[mainCat]) {
        categoryProducts[mainCat] = []
      }
      categoryProducts[mainCat].push(product)
    }

    // Get one product from each category (prefer higher rating)
    const resultProducts: string[] = []
    for (const [mainCategory, products] of Object.entries(categoryProducts)) {
      // Sort by rating descending and take the first one
      const sortedProducts = products.sort(
        (a, b) => {
          const ratingA = parseFloat(a.ratings || "0") || 0
          const ratingB = parseFloat(b.ratings || "0") || 0
          return ratingB - ratingA
        }
      )
      if (sortedProducts.length > 0) {
        resultProducts.push(sortedProducts[0].id)
      }
    }

    // Limit to 4 products
    const limitedProducts = resultProducts.slice(0, 4)

    return NextResponse.json({ product_ids: limitedProducts })
  } catch (error) {
    console.error("[Discounted Products] Error:", error)
    return NextResponse.json({ product_ids: [] }, { status: 200 })
  }
}

