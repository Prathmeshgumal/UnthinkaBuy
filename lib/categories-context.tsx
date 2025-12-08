"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { fetchCategoriesFromSupabase } from "./products-data"

interface CategoriesContextType {
  categories: string[]
  isLoading: boolean
  error: string | null
}

const CategoriesContext = createContext<CategoriesContextType>({
  categories: [],
  isLoading: true,
  error: null,
})

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true)
      setError(null)
      try {
        const fetchedCategories = await fetchCategoriesFromSupabase()
        setCategories(fetchedCategories)
        console.log(`[Categories] Loaded ${fetchedCategories.length} categories`)
      } catch (err) {
        console.error("[Categories] Failed to load categories:", err)
        setError("Failed to load categories")
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  return (
    <CategoriesContext.Provider value={{ categories, isLoading, error }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  return useContext(CategoriesContext)
}







