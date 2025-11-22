import type React from "react"
import type { Metadata } from "next"
import { Pirata_One, Source_Serif_4, JetBrains_Mono, Inter } from "next/font/google"
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

const stackSans = Inter({
  weight: ["200", "400"],
  subsets: ["latin"],
  variable: "--font-sans",
})

// For now using system fonts as fallback for UI text

export const metadata: Metadata = {
  title: "Mood Palette - AI-Powered Color Palette Generator | Carthay Studio",
  description:
    "Generate beautiful, harmonious color palettes from images using AI. Upload a photo, capture with your camera, or describe your vision to create stunning color schemes instantly.",
  generator: "v0.app",
  keywords: [
    "color palette",
    "color generator",
    "AI colors",
    "palette from image",
    "color scheme",
    "design tools",
    "Carthay Studio",
  ],
  authors: [{ name: "Carthay Studio" }],
  creator: "Carthay Studio",
  publisher: "Carthay Studio",
  metadataBase: new URL("https://moodpalette.carthaystudio.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moodpalette.carthaystudio.com",
    siteName: "Mood Palette",
    title: "Mood Palette - AI-Powered Color Palette Generator",
    description:
      "Generate beautiful, harmonious color palettes from images using AI. Create stunning color schemes instantly.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mood Palette - AI Color Palette Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mood Palette - AI-Powered Color Palette Generator",
    description: "Generate beautiful, harmonious color palettes from images using AI.",
    images: ["/og-image.png"],
    creator: "@carthaystudio",
  },
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
    <html
      lang="en"
      className={`${pirataOne.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} ${stackSans.variable}`}
    >
      <body className={`antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
