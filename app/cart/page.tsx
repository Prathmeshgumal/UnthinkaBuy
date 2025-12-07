"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchCart, removeFromCart, updateCartQuantity, clearCart } from "@/lib/cart-favorites"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface CartItem {
  id: string
  product_id: string
  quantity: number
  added_at: string
  products: {
    id: string
    name: string
    image: string
    discount_price: string | null
    actual_price: string | null
    sub_category: string
  }
}

export default function CartPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
      return
    }
    if (user) {
      loadCart()
    }
  }, [user, authLoading, router])

  const loadCart = async () => {
    try {
      setIsLoading(true)
      const data = await fetchCart()
      setCartItems(data.cart_items || [])
    } catch (error) {
      console.error("Failed to load cart:", error)
      toast({
        title: "Error",
        description: "Failed to load cart",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (productId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(productId))
    try {
      await removeFromCart(productId)
      await loadCart()
      toast({
        title: "Item removed",
        description: "Item removed from cart",
      })
    } catch (error) {
      console.error("Failed to remove item:", error)
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      })
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdatingItems((prev) => new Set(prev).add(productId))
    try {
      await updateCartQuantity(productId, newQuantity)
      await loadCart()
    } catch (error) {
      console.error("Failed to update quantity:", error)
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      })
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleClearCart = async () => {
    if (!confirm("Are you sure you want to clear your cart?")) return

    try {
      await clearCart()
      await loadCart()
      toast({
        title: "Cart cleared",
        description: "All items removed from cart",
      })
    } catch (error) {
      console.error("Failed to clear cart:", error)
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      })
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.products.discount_price || item.products.actual_price || "₹0"
      const priceNum = Number.parseInt(price.replace(/[^0-9]/g, "")) || 0
      return total + priceNum * item.quantity
    }, 0)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-8 w-8" />
              Shopping Cart ({cartItems.length})
            </h1>
            {cartItems.length > 0 && (
              <Button variant="outline" onClick={handleClearCart} className="text-destructive hover:text-destructive">
                Clear Cart
              </Button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add some products to get started!</p>
              <Button onClick={() => router.push("/")} className="bg-primary text-primary-foreground">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card border border-border rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="relative w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item.products.image || "/placeholder.svg"}
                        alt={item.products.name}
                        fill
                        className="object-contain p-2"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground line-clamp-2">{item.products.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{item.products.sub_category}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            disabled={updatingItems.has(item.product_id) || item.quantity <= 1}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            disabled={updatingItems.has(item.product_id)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Price and Remove */}
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-lg text-foreground">
                            ₹{Number.parseInt((item.products.discount_price || item.products.actual_price || "0").replace(/[^0-9]/g, "")) * item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(item.product_id)}
                            disabled={updatingItems.has(item.product_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                  <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>₹{calculateTotal()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span className="text-success">FREE</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-foreground">
                      <span>Total</span>
                      <span>₹{calculateTotal()}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                    Proceed to Checkout
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => router.push("/")}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}


