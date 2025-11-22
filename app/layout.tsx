import type React from "react"
import type { Metadata } from "next"
import { Pirata_One, Source_Serif_4, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const pirataOne = Pirata_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brand",
})

const sourceSerif = Source_Serif_4({
  weight: ["200", "300"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-product",
})

const jetbrainsMono = JetBrains_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-action",
})

// For now using system fonts as fallback for UI text

export const metadata: Metadata = {
  title: "Mood Palette - Carthay Studio",
  description: "AI-powered color palette generator",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${pirataOne.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}>
      <body className={`antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
