"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCategories } from "@/lib/categories-context"
import { cn } from "@/lib/utils"

export function CategoryNav() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { categories, isLoading } = useCategories()
  const selectedCategory = searchParams.get("category") || ""

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category === selectedCategory) {
      // If clicking the same category, clear the filter
      params.delete("category")
    } else {
      params.set("category", category)
    }
    params.delete("page") // Reset to page 1
    const queryString = params.toString()
    router.push(queryString ? `/?${queryString}` : "/")
  }

  const handleAllCategories = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("category")
    params.delete("page")
    const queryString = params.toString()
    router.push(queryString ? `/?${queryString}` : "/")
  }

  if (isLoading) {
    return (
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background border-b border-border sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-3">
          {/* Home Button */}
          <button
            onClick={handleAllCategories}
            className={cn(
              "flex-shrink-0 text-sm font-medium transition-colors whitespace-nowrap pb-1 border-b-2",
              !selectedCategory
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            Home
          </button>

          {/* Category Links */}
          {categories.map((category) => {
            const isActive = selectedCategory === category
            return (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "flex-shrink-0 text-sm font-medium transition-colors whitespace-nowrap pb-1 border-b-2 capitalize",
                  isActive
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}



