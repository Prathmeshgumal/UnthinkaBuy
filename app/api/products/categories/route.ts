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

    // Fetch all products to get unique categories
    // Since the dataset is smaller now, we can fetch all at once
    const allCategories = new Set<string>()
    let page = 0
    const pageSize = 10000
    let hasMore = true

    console.log("[v0] Categories: Fetching all unique categories...")

    while (hasMore) {
      const offset = page * pageSize
      const { data, error } = await supabase
        .from("products")
        .select("main_category")
        .order("created_at", { ascending: true })
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error(`[v0] Categories: Error at page ${page}:`, error.message)
        break
      }

      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      // Add all categories from this page
      data.forEach((item) => {
        if (item.main_category) {
          allCategories.add(item.main_category)
        }
      })

      // If we got fewer results than pageSize, we've reached the end
      if (data.length < pageSize) {
        hasMore = false
      } else {
        page++
      }

      // Safety limit: stop after 50 pages (500k products) to avoid infinite loops
      if (page >= 50) {
        console.warn("[v0] Categories: Reached safety limit of 50 pages")
        break
      }
    }

    // Convert set to sorted array
    const categories = Array.from(allCategories).sort()
    console.log(`[v0] Found ${categories.length} unique categories after scanning ${page + 1} page(s)`)

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("[v0] Categories error:", error)
    return NextResponse.json({ categories: [] })
  }
}
