"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ShoppingCart, User, Menu, X, ChevronDown, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useCategories } from "@/lib/categories-context"
import { fetchCart, fetchFavorites } from "@/lib/cart-favorites"
import { AuthModal } from "./auth-modal"
import { CategoryNav } from "./category-nav"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const otherNavItems = ["Brands", "New Arrivals", "Best Sellers", "Deals"]

export function Header() {
  return (
    <Suspense fallback={<div className="h-16 bg-background border-b border-border" />}>
      <HeaderContent />
    </Suspense>
  )
}

function HeaderContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartCount, setCartCount] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Load cart and favorites count
  useEffect(() => {
    if (user) {
      loadCounts()
      // Refresh counts every 30 seconds while user is logged in
      const interval = setInterval(loadCounts, 30000)
      return () => clearInterval(interval)
    } else {
      setCartCount(0)
      setFavoritesCount(0)
    }
  }, [user])

  const loadCounts = async () => {
    try {
      const [cartData, favoritesData] = await Promise.all([
        fetchCart().catch(() => ({ cart_items: [] })),
        fetchFavorites().catch(() => ({ favorites: [] }))
      ])
      setCartCount(cartData.cart_items?.length || 0)
      setFavoritesCount(favoritesData.favorites?.length || 0)
    } catch (error) {
      console.error("Failed to load counts:", error)
    }
  }

  const handleCategorySelect = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set("category", category)
    } else {
      params.delete("category")
    }
    params.delete("page") // Reset to page 1 when changing category
    const queryString = params.toString()
    router.push(queryString ? `/?${queryString}` : "/")
  }

  return (
    <>
      {/* Top Banner */}
      <div className="bg-primary text-primary-foreground py-2 overflow-hidden">
        <div className="flex animate-scroll-banner whitespace-nowrap">
          <span className="mx-8 text-sm font-medium">MEGA SALE - Get Your Amazing Deals! Up to 70% OFF</span>
          <span className="mx-8 text-sm font-medium">Free Shipping on Orders Above ₹499</span>
          <span className="mx-8 text-sm font-medium">MEGA SALE - Get Your Amazing Deals! Up to 70% OFF</span>
          <span className="mx-8 text-sm font-medium">Free Shipping on Orders Above ₹499</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo.jpg"
                alt="UnthinkaBuy"
                width={180}
                height={50}
                className="h-12 w-auto object-contain"
                priority
              />
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-6">
              {/* Categories Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
                    Categories
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-96 overflow-y-auto">
                  {isLoadingCategories ? (
                    <DropdownMenuItem disabled>Loading categories...</DropdownMenuItem>
                  ) : categories.length > 0 ? (
                    <>
                      <DropdownMenuItem onClick={() => handleCategorySelect("")} className="font-semibold">
                        All Categories
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {categories.map((category) => (
                        <DropdownMenuItem key={category} onClick={() => handleCategorySelect(category)} className="capitalize">
                          {category}
                        </DropdownMenuItem>
                      ))}
                    </>
                  ) : (
                    <DropdownMenuItem disabled>No categories found</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Other Navigation Items */}
              {otherNavItems.map((item) => (
                <button
                  key={item}
                  className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {item}
                  <ChevronDown className="h-4 w-4" />
                </button>
              ))}
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search on UnthinkaBuy"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 w-full bg-muted border-0 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-5 w-5" />
                      <span className="hidden sm:inline">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>My Account</DropdownMenuItem>
                    <DropdownMenuItem>Orders</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/favorites")}>Wishlist</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Sign In
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => user ? router.push("/favorites") : setIsAuthModalOpen(true)}
              >
                <Heart className="h-5 w-5" />
                {user && favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => user ? router.push("/cart") : setIsAuthModalOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {user && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Mobile Menu Button */}
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search on UnthinkaBuy"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 w-full bg-muted border-0"
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <nav className="container mx-auto px-4 py-4">
              {/* Categories Dropdown for Mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between w-full py-3 text-sm font-medium text-foreground hover:text-primary border-b border-border">
                    Categories
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-96 overflow-y-auto">
                  {isLoadingCategories ? (
                    <DropdownMenuItem disabled>Loading categories...</DropdownMenuItem>
                  ) : categories.length > 0 ? (
                    <>
                      <DropdownMenuItem onClick={() => handleCategorySelect("")} className="font-semibold">
                        All Categories
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {categories.map((category) => (
                        <DropdownMenuItem key={category} onClick={() => handleCategorySelect(category)} className="capitalize">
                          {category}
                        </DropdownMenuItem>
                      ))}
                    </>
                  ) : (
                    <DropdownMenuItem disabled>No categories found</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Other Navigation Items for Mobile */}
              {otherNavItems.map((item) => (
                <button
                  key={item}
                  className="flex items-center justify-between w-full py-3 text-sm font-medium text-foreground hover:text-primary border-b border-border last:border-0"
                >
                  {item}
                  <ChevronDown className="h-4 w-4" />
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Category Navigation Bar */}
      <CategoryNav />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  )
}
