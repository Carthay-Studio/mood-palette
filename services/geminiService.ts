import type { Palette } from "../types"

export const generatePaletteFromPrompt = async (prompt: string): Promise<Palette> => {
  const response = await fetch("/api/generate-palette", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "prompt", prompt }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to generate palette")
  }

  return response.json()
}

export const namePaletteFromColors = async (prompt: string, colors: string[]): Promise<Palette> => {
  const response = await fetch("/api/generate-palette", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "colors", prompt, colors }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to generate palette")
  }

  return response.json()
}
