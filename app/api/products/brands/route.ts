import { type NextRequest, NextResponse } from "next/server"
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
      return NextResponse.json({ brands: [] })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    // Fetch unique brands
    const allBrands = new Set<string>()
    const sampleRanges = [
      { start: 0, end: 9999 },
      { start: 50000, end: 59999 },
      { start: 100000, end: 109999 },
    ]

    const promises = sampleRanges.map(async (range) => {
      try {
        let query = supabase
          .from("products")
          .select("brand")
          .order("created_at", { ascending: true })
          .range(range.start, range.end)

        if (category) {
          query = query.eq("main_category", category)
        }

        const { data, error } = await query

        if (error) {
          return []
        }

        return data?.map((item) => item.brand).filter(Boolean) || []
      } catch (err) {
        return []
      }
    })

    const results = await Promise.all(promises)
    results.forEach((brands) => {
      brands.forEach((brand) => allBrands.add(brand))
    })

    // If we have few brands, do a more thorough scan
    if (allBrands.size < 10) {
      let page = 0
      const pageSize = 5000
      const maxPages = 20

      while (page < maxPages) {
        const offset = page * pageSize
        let query = supabase
          .from("products")
          .select("brand")
          .order("created_at", { ascending: true })
          .range(offset, offset + pageSize - 1)

        if (category) {
          query = query.eq("main_category", category)
        }

        const { data, error } = await query

        if (error || !data || data.length === 0) {
          break
        }

        data.forEach((item) => {
          if (item.brand) {
            allBrands.add(item.brand)
          }
        })

        if (data.length < pageSize) {
          break
        }

        page++
      }
    }

    const brands = Array.from(allBrands).sort()
    return NextResponse.json({ brands })
  } catch (error) {
    console.error("[v0] Brands error:", error)
    return NextResponse.json({ brands: [] })
  }
}










