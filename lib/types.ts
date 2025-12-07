export interface User {
  id: string
  email: string
  name: string
}

export interface Product {
  id: string
  name: string
  main_category: string
  sub_category: string
  image: string
  link?: string
  ratings?: string
  no_of_ratings?: string
  discount_price?: string
  actual_price?: string
  brand?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
}

export interface FilterState {
  category?: string
  minRating?: number
  priceRange?: [number, number]
  search?: string
}
