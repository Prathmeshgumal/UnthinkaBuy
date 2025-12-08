"use client"

import { useState, useRef, useEffect } from "react"
import { ProductCard } from "./product-card"
import type { RecommendedProduct } from "@/lib/types"
import { Sparkles, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface RecommendationRowProps {
    products: RecommendedProduct[]
    displayedCount?: number
    onShowMore?: () => void
    hasMore?: boolean
}

export function RecommendationRow({ products }: RecommendationRowProps) {
    const [selectedProduct, setSelectedProduct] = useState<RecommendedProduct | null>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    if (!products || products.length === 0) return null

    // Deduplicate products by ID, keeping the first occurrence
    const uniqueProducts = products.filter((product, index, self) =>
        index === self.findIndex((p) => p.id === product.id)
    )

    // Check scroll position
    const checkScroll = () => {
        if (!scrollContainerRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }

    useEffect(() => {
        checkScroll()
        const container = scrollContainerRef.current
        if (container) {
            container.addEventListener('scroll', checkScroll)
            window.addEventListener('resize', checkScroll)
            return () => {
                container.removeEventListener('scroll', checkScroll)
                window.removeEventListener('resize', checkScroll)
            }
        }
    }, [products])

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return
        const scrollAmount = scrollContainerRef.current.clientWidth * 0.8
        const scrollTo = direction === 'left'
            ? scrollContainerRef.current.scrollLeft - scrollAmount
            : scrollContainerRef.current.scrollLeft + scrollAmount

        scrollContainerRef.current.scrollTo({
            left: scrollTo,
            behavior: 'smooth'
        })
    }

    return (
        <>
            <div className="py-6 my-4 border-y border-border/50 bg-secondary/5 rounded-xl px-4 md:px-6 relative">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    <h3 className="text-xl font-semibold text-foreground">Recommended For You</h3>
                    <span className="text-xs text-muted-foreground ml-auto bg-background/50 px-2 py-1 rounded-full border border-border">
                        Based on your activity
                    </span>
                </div>

                {/* Horizontal scrollable container with relative positioning for buttons */}
                <div className="relative">
                    {/* Scroll buttons - positioned relative to scroll container */}
                    {canScrollLeft && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 hover:bg-background shadow-lg border border-border"
                            onClick={() => scroll('left')}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}
                    {canScrollRight && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 hover:bg-background shadow-lg border border-border"
                            onClick={() => scroll('right')}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    )}

                    {/* Horizontal scrollable container */}
                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch',
                        }}
                        onScroll={checkScroll}
                    >
                        <div className="flex gap-3 min-w-max pb-2" style={{ width: 'max-content' }}>
                            {uniqueProducts.map((product, index) => (
                                <div
                                    key={`${product.id}-${index}`}
                                    className="relative group flex-shrink-0 w-36 sm:w-40 md:w-44 snap-start"
                                >
                                    <div className="relative">
                                        <ProductCard product={product} compact={true} />
                                        {product.reason && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-2 right-9 h-6 w-6 p-0 bg-background/80 hover:bg-background rounded-full z-20"
                                                onClick={() => setSelectedProduct(product)}
                                                title="Why is this recommended?"
                                            >
                                                <HelpCircle className="h-4 w-4 text-primary" />
                                            </Button>
                                        )}
                                    </div>
                                    {product.match_score && (
                                        <div className="mt-2 flex justify-between items-center px-1">
                                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden max-w-[80px]">
                                                <div
                                                    className="h-full bg-primary/70 transition-all duration-500"
                                                    style={{ width: `${Math.min(product.match_score * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {Math.round(product.match_score * 100)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Why? Dialog */}
            <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Why is this recommended?</DialogTitle>
                        <DialogDescription>
                            {selectedProduct?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {selectedProduct?.reason ? (
                            <p className="text-sm text-muted-foreground">{selectedProduct.reason}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                This product is recommended based on your browsing and purchase history.
                            </p>
                        )}
                        {selectedProduct?.match_score && (
                            <div className="mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium">Match Score:</span>
                                    <span className="text-sm text-muted-foreground">
                                        {Math.round(selectedProduct.match_score * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${Math.min(selectedProduct.match_score * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
