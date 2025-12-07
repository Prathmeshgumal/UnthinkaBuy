import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UnthinkaBuy - Shop the Unthinkable Deals",
  description:
    "Your one-stop destination for amazing deals on quality products. Shop the unthinkable, save the unbelievable.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#e11d70",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
