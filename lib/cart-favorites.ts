/**
 * Cart and Favorites API utilities
 */

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  added_at: string
  updated_at: string
  products?: any
}

export interface Favorite {
  id: string
  product_id: string
  added_at: string
  products?: any
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

// ==================== CART FUNCTIONS ====================

export async function fetchCart(): Promise<{ cart_items: CartItem[]; total_items: number }> {
  const token = getAuthToken()
  if (!token) {
    throw new Error("User not authenticated")
  }

  const response = await fetch("/api/cart", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch cart")
  }

  return response.json()
}

export async function addToCart(productId: string, quantity: number = 1): Promise<any> {
  const token = getAuthToken()
  if (!token) {
    throw new Error("User not authenticated")
  }

  const response = await fetch("/api/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id: productId, quantity }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("Failed to add to cart:", errorData)

    // If token is invalid, clear it and prompt re-login
    if (response.status === 401 || errorData.detail?.includes("token")) {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_user")
      throw new Error("Session expired. Please sign in again.")
    }

    throw new Error(errorData.detail || errorData.error || "Failed to add to cart")
  }

  return response.json()
}

export async function updateCartQuantity(productId: string, quantity: number): Promise<any> {
  const token = getAuthToken()
  if (!token) {
    throw new Error("User not authenticated")
  }

  const response = await fetch(`/api/cart/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
  })

  if (!response.ok) {
    throw new Error("Failed to update cart quantity")
  }

  return response.json()
}

export async function removeFromCart(productId: string): Promise<any> {
  const token = getAuthToken()
  if (!token) {
    throw new Error("User not authenticated")
  }

  const response = await fetch(`/api/cart/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to remove from cart")
  }

  return response.json()
}

export async function clearCart(): Promise<any> {
  const token = getAuthToken()
  if (!token) {
    throw new Error("User not authenticated")
  }

  const response = await fetch("/api/cart", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to clear cart")
  }

  return response.json()
}

// ==================== FAVORITES FUNCTIONS ====================

export async function fetchFavorites(): Promise<{ favorites: Favorite[]; total: number }> {
  const token = getAuthToken()
  if (!token) {
    throw new Error("User not authenticated")
  }

  const response = await fetch("/api/favorites", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch favorites")
  }

  return response.json()
}

export async function addToFavorites(productId: string): Promise<any> {
  const token = getAuthToken()
  if (!token) {
    throw new Error("User not authenticated")
  }

  const response = await fetch(`/api/favorites/${productId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || errorData.detail || "Failed to add to favorites")
  }

  return response.json()
}

export async function removeFromFavorites(productId: string): Promise<any> {
  const token = getAuthToken()
  if (!token) {
    throw new Error("User not authenticated")
  }

  const response = await fetch(`/api/favorites/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to remove from favorites")
  }

  return response.json()
}

export async function toggleFavorite(productId: string, isFavorited: boolean): Promise<any> {
  if (isFavorited) {
    return removeFromFavorites(productId)
  } else {
    return addToFavorites(productId)
  }
}

