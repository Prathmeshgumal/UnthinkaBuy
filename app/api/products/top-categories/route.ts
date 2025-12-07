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
      return NextResponse.json({ categories: [] })
    }

    // Fetch all products to calculate average rating per category and find best-rated product
    const categoryData = new Map<
      string,
      { 
        totalReviews: number
        totalRating: number
        productCount: number
        bestProduct: { image: string; rating: number } | null 
      }
    >()
    let page = 0
    const pageSize = 10000
    let hasMore = true

    console.log("[v0] Top Categories: Calculating average ratings and best products per category...")

    while (hasMore) {
      const offset = page * pageSize
      const { data, error } = await supabase
        .from("products")
        .select("main_category, no_of_ratings, ratings, image")
        .order("created_at", { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error(`[v0] Top Categories: Error at page ${page}:`, error.message)
        break
      }

      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      // Process each product
      data.forEach((item) => {
        if (item.main_category) {
          // Calculate total reviews
          const reviewsStr = item.no_of_ratings || "0"
          // Extract numeric value from reviews string (e.g., "78,970" -> 78970)
          const reviews = Number.parseInt(reviewsStr.replace(/[^0-9]/g, "")) || 0

          // Get rating
          const ratingStr = item.ratings || "0"
          const rating = Number.parseFloat(ratingStr) || 0

          // Get current category data
          const current = categoryData.get(item.main_category) || {
            totalReviews: 0,
            totalRating: 0,
            productCount: 0,
            bestProduct: null,
          }

          // Add reviews and rating (only count products with valid ratings > 0)
          current.totalReviews += reviews
          if (rating > 0) {
            current.totalRating += rating
            current.productCount += 1
          }

          // Check if this is the best-rated product for this category
          if (
            !current.bestProduct ||
            rating > current.bestProduct.rating ||
            (rating === current.bestProduct.rating && reviews > 0)
          ) {
            current.bestProduct = {
              image: item.image || "",
              rating: rating,
            }
          }

          categoryData.set(item.main_category, current)
        }
      })

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

    // Calculate average rating for each category and sort by rating
    const topCategories = Array.from(categoryData.entries())
      .map(([category, data]) => ({
        category,
        totalReviews: data.totalReviews,
        averageRating: data.productCount > 0 ? data.totalRating / data.productCount : 0,
        bestProductImage: data.bestProduct?.image || "",
        bestProductRating: data.bestProduct?.rating || 0,
      }))
      .filter(item => item.averageRating > 0) // Only include categories with valid ratings
      .sort((a, b) => b.averageRating - a.averageRating) // Sort by average rating descending
      .slice(0, 10) // Get top 10

    console.log(`[v0] Top Categories: Found top ${topCategories.length} categories by rating`)

    return NextResponse.json({ categories: topCategories })
  } catch (error) {
    console.error("[v0] Top Categories error:", error)
    return NextResponse.json({ categories: [] })
  }
}

