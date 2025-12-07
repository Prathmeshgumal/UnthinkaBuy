import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error("[v0] Supabase credentials missing")
    return null
  }

  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      console.error("[v0] Failed to create Supabase client - check environment variables")
      console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing")
      console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing")
      return NextResponse.json({ products: [], total: 0, page: 1, limit: 20, error: "Supabase not configured" })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const category = searchParams.get("category")
    const subCategory = searchParams.get("sub_category")
    const brand = searchParams.get("brand")
    const minPrice = searchParams.get("min_price")
    const maxPrice = searchParams.get("max_price")
    const minRating = searchParams.get("min_rating")
    const sort = searchParams.get("sort") || "default"

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: true })

    // Apply category filter if provided
    if (category) {
      query = query.eq("main_category", category)
    }

    // Apply sub-category filter if provided
    if (subCategory) {
      query = query.eq("sub_category", subCategory)
    }

    // Apply brand filter if provided
    if (brand) {
      query = query.eq("brand", brand)
    }

    // Fetch all data first (we'll filter by price in JS since it's stored as text)
    const { data: allData, error, count: totalCount } = await query

    if (error) {
      console.error("[v0] Products fetch error:", error)
      return NextResponse.json({ products: [], total: 0, page, limit, error: error.message })
    }

    // Filter by price range and rating in JavaScript since they're stored as text
    let filteredData = allData || []
    
    // Filter by price range
    if (minPrice || maxPrice) {
      const min = minPrice ? Number.parseInt(minPrice) : 0
      const max = maxPrice ? Number.parseInt(maxPrice) : Number.MAX_SAFE_INTEGER

      filteredData = filteredData.filter((item) => {
        const priceStr = item.discount_price || item.actual_price || "0"
        // Extract numeric value from price string (e.g., "₹1,299" -> 1299)
        const price = Number.parseInt(priceStr.replace(/[^0-9]/g, "")) || 0
        return price >= min && price <= max
      })
    }

    // Filter by minimum rating
    if (minRating) {
      const minRatingValue = parseFloat(minRating) || 0
      filteredData = filteredData.filter((item) => {
        const ratingStr = item.ratings || "0"
        const rating = parseFloat(ratingStr) || 0
        return rating > minRatingValue
      })
    }

    // Sort logic
    if (sort === "price_low" || sort === "price_high") {
      // Sort by price if requested
      filteredData.sort((a, b) => {
        const priceAStr = a.discount_price || a.actual_price || "0"
        const priceBStr = b.discount_price || b.actual_price || "0"
        const priceA = Number.parseInt(priceAStr.replace(/[^0-9]/g, "")) || 0
        const priceB = Number.parseInt(priceBStr.replace(/[^0-9]/g, "")) || 0

        if (sort === "price_low") {
          return priceA - priceB
        } else {
          return priceB - priceA
        }
      })
    } else if (category && sort === "default") {
      // When category is selected and default sort: sort by sub_category first, then by rating
      filteredData.sort((a, b) => {
        // First sort by sub_category (alphabetically)
        const subCatA = a.sub_category || ""
        const subCatB = b.sub_category || ""
        const subCatCompare = subCatA.localeCompare(subCatB)
        
        if (subCatCompare !== 0) {
          return subCatCompare
        }
        
        // Within the same sub_category, sort by rating (descending)
        const ratingA = parseFloat(a.ratings || "0") || 0
        const ratingB = parseFloat(b.ratings || "0") || 0
        return ratingB - ratingA
      })
    }

    // Apply pagination after filtering and sorting
    const paginatedData = filteredData.slice(offset, offset + limit)
    const count = filteredData.length

    console.log("[v0] Fetched products:", paginatedData?.length || 0, "Total count:", count, "Sort:", sort)

    const products =
      paginatedData?.map((item) => ({
        id: item.id,
        name: item.name,
        main_category: item.main_category,
        sub_category: item.sub_category,
        image: item.image,
        link: item.link,
        ratings: item.ratings,
        no_of_ratings: item.no_of_ratings,
        discount_price: item.discount_price,
        actual_price: item.actual_price,
        brand: item.brand,
      })) || []

    return NextResponse.json({
      products,
      total: count || products.length,
      page,
      limit,
    })
  } catch (error) {
    console.error("[v0] Products error:", error)
    return NextResponse.json({ products: [], total: 0, page: 1, limit: 20 })
  }
}
