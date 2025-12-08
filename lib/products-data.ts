import type { Product, RecommendedProduct } from "./types"

// Mock products data (used when Supabase is not connected)
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "SOFTSPUN Microfiber Cloth - 4 pcs - 340 GSM Grey",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/W/IMAGERENDERING_521856-T1/images/I/91C6slV1XGL._AC_UL320_.jpg",
    link: "#",
    ratings: "4.3",
    no_of_ratings: "78,970",
    discount_price: "₹269",
    actual_price: "₹604",
  },
  {
    id: "2",
    name: "Involve Your Senses One Musk Organic Car Perfume",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/W/IMAGERENDERING_521856-T1/images/I/51vw-wdV-eL._AC_UL320_.jpg",
    link: "#",
    ratings: "3.8",
    no_of_ratings: "17,245",
    discount_price: "₹307",
    actual_price: "₹399",
  },
  {
    id: "3",
    name: 'Bosch High Performance Replacement Wiper Blade 24"',
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/I/61H8WL8XKFL._AC_UL320_.jpg",
    link: "#",
    ratings: "4.1",
    no_of_ratings: "12,450",
    discount_price: "₹549",
    actual_price: "₹850",
  },
  {
    id: "4",
    name: "3M Car Care Dashboard Polish 200ml",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/I/71pQYLr8NFL._AC_UL320_.jpg",
    link: "#",
    ratings: "4.4",
    no_of_ratings: "25,890",
    discount_price: "₹299",
    actual_price: "₹450",
  },
  {
    id: "5",
    name: "Wavex Car Polish and Wax 350gm Premium",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/I/61kJXGKCVaL._AC_UL320_.jpg",
    link: "#",
    ratings: "4.2",
    no_of_ratings: "8,765",
    discount_price: "₹399",
    actual_price: "₹599",
  },
  {
    id: "6",
    name: "NIKAVI Motorcycle Cover Waterproof UV Protective",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/I/71w5NxVHCxL._AC_UL320_.jpg",
    link: "#",
    ratings: "4.0",
    no_of_ratings: "15,320",
    discount_price: "₹449",
    actual_price: "₹799",
  },
  {
    id: "7",
    name: "Ambi Pur Car Air Freshener Gel Exotic Jasmine",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/I/71fP3g9aHRL._AC_UL320_.jpg",
    link: "#",
    ratings: "4.5",
    no_of_ratings: "32,100",
    discount_price: "₹279",
    actual_price: "₹399",
  },
  {
    id: "8",
    name: "Park Avenue Premium Car Seat Cover Set",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/I/81mVqz+T8QL._AC_UL320_.jpg",
    link: "#",
    ratings: "3.9",
    no_of_ratings: "5,670",
    discount_price: "₹1,299",
    actual_price: "₹2,499",
  },
  {
    id: "9",
    name: "Digital Tire Pressure Gauge LCD Display",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/I/61VfL3yjNSL._AC_UL320_.jpg",
    link: "#",
    ratings: "4.3",
    no_of_ratings: "9,870",
    discount_price: "₹349",
    actual_price: "₹599",
  },
  {
    id: "10",
    name: "Vega Cliff DX Motorcycle Helmet Full Face",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/I/61m4xKb26pL._AC_UL320_.jpg",
    link: "#",
    ratings: "4.1",
    no_of_ratings: "22,340",
    discount_price: "₹899",
    actual_price: "₹1,499",
  },
  {
    id: "11",
    name: "LED Headlight Bulbs H4 High Low Beam Kit",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/I/71KP2gKxCnL._AC_UL320_.jpg",
    link: "#",
    ratings: "4.4",
    no_of_ratings: "11,230",
    discount_price: "₹1,199",
    actual_price: "₹2,299",
  },
  {
    id: "12",
    name: "Car Phone Mount Magnetic Dashboard Holder",
    main_category: "car & motorbike",
    sub_category: "All Car & Motorbike Products",
    image: "https://m.media-amazon.com/images/I/61RV3JkWfWL._AC_UL320_.jpg",
    link: "#",
    ratings: "4.2",
    no_of_ratings: "18,900",
    discount_price: "₹299",
    actual_price: "₹599",
  },
]

const API_BASE = "/api"

export async function fetchProductsFromSupabase(
  page: number = 1,
  limit: number = 50,
  category?: string,
  subCategory?: string,
  brand?: string,
  minPrice?: string,
  maxPrice?: string,
  minRating?: string,
  sort?: string
): Promise<{
  products: Product[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}> {
  try {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", limit.toString())
    if (category) {
      params.set("category", category)
    }
    if (subCategory) {
      params.set("sub_category", subCategory)
    }
    if (brand) {
      params.set("brand", brand)
    }
    if (minPrice) {
      params.set("min_price", minPrice)
    }
    if (maxPrice) {
      params.set("max_price", maxPrice)
    }
    if (minRating) {
      params.set("min_rating", minRating)
    }
    if (sort && sort !== "default") {
      params.set("sort", sort)
    }

    const response = await fetch(`${API_BASE}/products?${params.toString()}`)

    if (!response.ok) {
      console.error("[v0] API error:", response.statusText)
      return { products: [], total: 0, page, limit, hasMore: false }
    }

    const data = await response.json()
    const total = data.total || 0
    const hasMore = page * limit < total

    return {
      products: data.products as Product[],
      total,
      page: data.page || page,
      limit: data.limit || limit,
      hasMore,
    }
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return { products: [], total: 0, page, limit, hasMore: false }
  }
}

export async function fetchCategoriesFromSupabase(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/products/categories`)

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.categories || []
  } catch (error) {
    console.error("[v0] Error fetching categories:", error)
    return []
  }
}

export interface TopCategory {
  category: string
  totalReviews: number
  bestProductImage: string
  bestProductRating: number
}

export async function fetchTopCategoriesByReviews(): Promise<TopCategory[]> {
  try {
    const response = await fetch(`${API_BASE}/products/top-categories`)

    if (!response.ok) {
      console.error("[v0] API error:", response.statusText)
      return []
    }

    const data = await response.json()
    return data.categories || []
  } catch (error) {
    console.error("[v0] Error fetching top categories:", error)
    return []
  }
}

// Keep these for fallback/compatibility
export function getProducts(): Product[] {
  return []
}

export async function fetchUserRecommendations(userId: string, limit: number = 10): Promise<RecommendedProduct[]> {
  try {
    console.log(`[Recommendations] Fetching for user: ${userId}, limit: ${limit}`)
    const response = await fetch(`${API_BASE}/recommendations/user/${userId}?limit=${limit}`)
    
    if (!response.ok) {
      console.error(`[Recommendations] API error: ${response.status} ${response.statusText}`)
      const errorText = await response.text().catch(() => "")
      console.error(`[Recommendations] Error details: ${errorText}`)
      return []
    }
    
    const data = await response.json()
    console.log(`[Recommendations] Received ${data?.length || 0} recommendations`)
    
    // Transform the response to match RecommendedProduct interface
    // API returns 'id' but we need to ensure all fields are present
    const transformed = (data || []).map((item: any) => ({
      id: item.id || item.product_id || "",
      name: item.name || "",
      main_category: item.main_category || "",
      sub_category: item.sub_category || "",
      image: item.image || "",
      link: item.link,
      ratings: item.ratings,
      no_of_ratings: item.no_of_ratings,
      discount_price: item.discount_price,
      actual_price: item.actual_price,
      brand: item.brand,
      match_score: item.match_score,
      reason: item.reason,
    }))
    
    console.log(`[Recommendations] Transformed to ${transformed.length} products`)
    return transformed as RecommendedProduct[]
  } catch (error) {
    console.error("[Recommendations] Error fetching:", error)
    return []
  }
}
