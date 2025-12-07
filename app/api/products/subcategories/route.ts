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
      return NextResponse.json({ subcategories: [] })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    if (!category) {
      return NextResponse.json({ subcategories: [] })
    }

    // Fetch unique subcategories for the given category
    // Sample from multiple ranges to get all subcategories
    const allSubCategories = new Set<string>()
    const sampleRanges = [
      { start: 0, end: 9999 },
      { start: 50000, end: 59999 },
      { start: 100000, end: 109999 },
    ]

    const promises = sampleRanges.map(async (range) => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("sub_category")
          .eq("main_category", category)
          .order("created_at", { ascending: true })
          .range(range.start, range.end)

        if (error) {
          return []
        }

        return data?.map((item) => item.sub_category).filter(Boolean) || []
      } catch (err) {
        return []
      }
    })

    const results = await Promise.all(promises)
    results.forEach((subCats) => {
      subCats.forEach((cat) => allSubCategories.add(cat))
    })

    // If we have few subcategories, do a more thorough scan
    if (allSubCategories.size < 10) {
      let page = 0
      const pageSize = 5000
      const maxPages = 20

      while (page < maxPages) {
        const offset = page * pageSize
        const { data, error } = await supabase
          .from("products")
          .select("sub_category")
          .eq("main_category", category)
          .order("created_at", { ascending: true })
          .range(offset, offset + pageSize - 1)

        if (error || !data || data.length === 0) {
          break
        }

        data.forEach((item) => {
          if (item.sub_category) {
            allSubCategories.add(item.sub_category)
          }
        })

        if (data.length < pageSize) {
          break
        }

        page++
      }
    }

    const subcategories = Array.from(allSubCategories).sort()
    return NextResponse.json({ subcategories })
  } catch (error) {
    console.error("[v0] Subcategories error:", error)
    return NextResponse.json({ subcategories: [] })
  }
}





