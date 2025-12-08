"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"
import { fetchProductsByIds } from "@/lib/random-cluster-products"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { logOrderEvent } from "@/lib/order-events"

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, token, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const productId = searchParams.get("productId") || ""

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      if (!productId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const products = await fetchProductsByIds([productId])
        setProduct(products[0] || null)
      } catch (error) {
        console.error("[Checkout] Failed to load product:", error)
        toast({
          title: "Error",
          description: "Failed to load product details.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId, toast])

  const parsePrice = (price?: string | null) => {
    if (!price) return 0
    return Number.parseInt(price.replace(/[^0-9]/g, "")) || 0
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place an order.",
        variant: "destructive",
      })
      return
    }

    if (!product) {
      toast({
        title: "No product selected",
        description: "Please go back and select a product.",
        variant: "destructive",
      })
      return
    }

    setIsPlacingOrder(true)
    try {
      // Log order placed event (fire-and-forget but awaited once for reliability)
      await logOrderEvent(product.id, "order_placed", token, {
        source: "checkout_page",
      })

      toast({
        title: "Order placed",
        description: "Your order has been placed successfully. (Demo order)",
      })

      router.push("/")
    } catch (error) {
      console.error("[Checkout] Failed to log order event:", error)
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Loading checkout...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">No product selected</h1>
            <p className="text-muted-foreground">
              Please go back and choose a product to continue to checkout.
            </p>
            <Button onClick={() => router.push("/")}>Back to Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const unitPrice = parsePrice(product.discount_price || product.actual_price)
  const quantity = 1
  const total = unitPrice * quantity

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Summary */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3 flex items-center justify-center bg-muted rounded-lg p-4">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="max-h-64 object-contain"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">
                  {product.main_category} • {product.sub_category}
                </p>
                <h1 className="text-2xl font-semibold text-foreground mb-2 line-clamp-3">
                  {product.name}
                </h1>
                <p className="text-xl font-bold text-primary mb-1">
                  {product.discount_price || product.actual_price}
                </p>
                {product.actual_price &&
                  product.discount_price &&
                  product.discount_price !== product.actual_price && (
                    <p className="text-sm text-muted-foreground">
                      <span className="line-through mr-2">{product.actual_price}</span>
                    </p>
                  )}
              </div>
              <div className="text-sm text-muted-foreground">
                Quantity: <span className="font-medium text-foreground">{quantity}</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-lg p-6 sticky top-24 h-fit">
            <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Item total</span>
                <span>₹{unitPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-success">FREE</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? "Placing Order..." : "Place Order"}
            </Button>

            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => router.push("/cart")}
            >
              Go to Cart
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}


