"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface FilterSidebarProps {
  selectedCategory?: string
}

export function FilterSidebar({ selectedCategory }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedSubCategory = searchParams.get("sub_category") || ""
  const selectedBrand = searchParams.get("brand") || ""
  const minPrice = Number.parseInt(searchParams.get("min_price") || "0")
  const maxPrice = Number.parseInt(searchParams.get("max_price") || "100000")

  const [subCategories, setSubCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [isLoadingSubCategories, setIsLoadingSubCategories] = useState(false)
  const [isLoadingBrands, setIsLoadingBrands] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice || 0, maxPrice || 100000])

  // Fetch subcategories when category changes
  useEffect(() => {
    async function fetchSubCategories() {
      if (!selectedCategory) {
        setSubCategories([])
        return
      }

      setIsLoadingSubCategories(true)
      try {
        const response = await fetch(`/api/products/subcategories?category=${encodeURIComponent(selectedCategory)}`)
        if (response.ok) {
          const data = await response.json()
          setSubCategories(data.subcategories || [])
        }
      } catch (error) {
        console.error("Failed to fetch subcategories:", error)
      } finally {
        setIsLoadingSubCategories(false)
      }
    }

    fetchSubCategories()
  }, [selectedCategory])

  // Fetch brands when category changes or on mount
  useEffect(() => {
    async function fetchBrands() {
      setIsLoadingBrands(true)
      try {
        const url = selectedCategory
          ? `/api/products/brands?category=${encodeURIComponent(selectedCategory)}`
          : "/api/products/brands"
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setBrands(data.brands || [])
        }
      } catch (error) {
        console.error("Failed to fetch brands:", error)
      } finally {
        setIsLoadingBrands(false)
      }
    }

    fetchBrands()
  }, [selectedCategory])

  // Update price range when URL params change
  useEffect(() => {
    const urlMin = Number.parseInt(searchParams.get("min_price") || "0")
    const urlMax = Number.parseInt(searchParams.get("max_price") || "100000")
    setPriceRange([urlMin, urlMax])
  }, [searchParams])

  const handleSubCategoryToggle = (subCategory: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedSubCategory === subCategory) {
      params.delete("sub_category")
    } else {
      params.set("sub_category", subCategory)
    }
    params.delete("page") // Reset to page 1
    router.push(`/?${params.toString()}`)
  }

  const handleBrandToggle = (brand: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedBrand === brand) {
      params.delete("brand")
    } else {
      params.set("brand", brand)
    }
    params.delete("page") // Reset to page 1
    router.push(`/?${params.toString()}`)
  }

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange([values[0], values[1]])
  }

  const handlePriceRangeApply = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (priceRange[0] > 0) {
      params.set("min_price", priceRange[0].toString())
    } else {
      params.delete("min_price")
    }
    if (priceRange[1] < 100000) {
      params.set("max_price", priceRange[1].toString())
    } else {
      params.delete("max_price")
    }
    params.delete("page") // Reset to page 1
    router.push(`/?${params.toString()}`)
  }

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("sub_category")
    params.delete("brand")
    params.delete("min_price")
    params.delete("max_price")
    params.delete("page")
    router.push(`/?${params.toString()}`)
  }

  const hasActiveFilters = selectedSubCategory || selectedBrand || minPrice > 0 || maxPrice < 100000

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-background border border-border rounded-lg p-4 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Brand Filter */}
        <div className="mb-6 pb-6 border-b border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">Brand</h4>
          {isLoadingBrands ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : brands.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center gap-2">
                  <Checkbox
                    id={brand}
                    checked={selectedBrand === brand}
                    onCheckedChange={() => handleBrandToggle(brand)}
                  />
                  <Label
                    htmlFor={brand}
                    className="text-sm text-foreground cursor-pointer flex-1 capitalize"
                  >
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No brands found</p>
          )}
        </div>

        {/* Sub-Category Filter */}
        {selectedCategory && (
          <div className="mb-6 pb-6 border-b border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">Sub-Category</h4>
            {isLoadingSubCategories ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : subCategories.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {subCategories.map((subCat) => (
                  <div key={subCat} className="flex items-center gap-2">
                    <Checkbox
                      id={subCat}
                      checked={selectedSubCategory === subCat}
                      onCheckedChange={() => handleSubCategoryToggle(subCat)}
                    />
                    <Label
                      htmlFor={subCat}
                      className="text-sm text-foreground cursor-pointer flex-1 capitalize"
                    >
                      {subCat}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sub-categories found</p>
            )}
          </div>
        )}

        {/* Price Range Filter */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Price Range (₹)</h4>
          <div className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              min={0}
              max={100000}
              step={100}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">₹{priceRange[0].toLocaleString()}</span>
              <span className="text-muted-foreground">₹{priceRange[1].toLocaleString()}</span>
            </div>
            <Button onClick={handlePriceRangeApply} size="sm" className="w-full">
              Apply Price Filter
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">Active Filters</h4>
            <div className="space-y-2">
              {selectedBrand && (
                <div className="flex items-center justify-between text-xs bg-muted px-2 py-1 rounded">
                  <span className="text-foreground">Brand: {selectedBrand}</span>
                  <button
                    onClick={() => handleBrandToggle(selectedBrand)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {selectedSubCategory && (
                <div className="flex items-center justify-between text-xs bg-muted px-2 py-1 rounded">
                  <span className="text-foreground">Sub-Category: {selectedSubCategory}</span>
                  <button
                    onClick={() => handleSubCategoryToggle(selectedSubCategory)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {minPrice > 0 && (
                <div className="flex items-center justify-between text-xs bg-muted px-2 py-1 rounded">
                  <span className="text-foreground">Min Price: ₹{minPrice.toLocaleString()}</span>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      params.delete("min_price")
                      params.delete("page")
                      router.push(`/?${params.toString()}`)
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {maxPrice < 100000 && (
                <div className="flex items-center justify-between text-xs bg-muted px-2 py-1 rounded">
                  <span className="text-foreground">Max Price: ₹{maxPrice.toLocaleString()}</span>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      params.delete("max_price")
                      params.delete("page")
                      router.push(`/?${params.toString()}`)
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
