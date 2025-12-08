"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"
import { fetchProductsByIds } from "@/lib/random-cluster-products"

export default function ReviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const productId = searchParams.get("productId") || ""

  const [product, setProduct] = useState<Product | null>(null)
  const [review, setReview] = useState("")
  const [isLoading, setIsLoading] = useState(true)

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
        console.error("[Review] Failed to load product:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to submit a review.",
        variant: "destructive",
      })
      return
    }

    if (!review.trim()) {
      toast({
        title: "Empty review",
        description: "Please write something before submitting.",
        variant: "destructive",
      })
      return
    }

    // This is a demo UI only; reviews are not persisted yet.
    toast({
      title: "Thank you!",
      description: "Your review has been submitted. (Demo only, not stored yet.)",
    })
    router.push("/")
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Loading review form...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Write a Review</h1>

          {product && (
            <div className="p-4 border border-border rounded-lg bg-card flex gap-4">
              <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="object-contain max-h-24"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase text-muted-foreground mb-1">
                  {product.main_category} • {product.sub_category}
                </p>
                <h2 className="text-base md:text-lg font-semibold text-foreground line-clamp-2">
                  {product.name}
                </h2>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your Review</label>
            <Textarea
              rows={6}
              placeholder="Share your experience about this product..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSubmit}>
              Submit Review
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}


