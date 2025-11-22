import { type NextRequest, NextResponse } from "next/server"
import { applyTypography } from "../../../services/textUtils"
import type { Palette } from "../../../types"

const paletteSchema = {
  type: "OBJECT",
  properties: {
    name: {
      type: "STRING",
      description:
        "A creative and descriptive name for the color palette, between 2 to 4 words. For example: 'Sunset Over the City' or 'Misty Forest Morning'.",
    },
    colors: {
      type: "ARRAY",
      description: "An array of exactly 8 colors that make up the palette.",
      items: {
        type: "OBJECT",
        properties: {
          name: {
            type: "STRING",
            description:
              "A descriptive name for the specific color. For example: 'Fiery Orange', 'Deep Teal', or 'Dusty Rose'.",
          },
          hex: {
            type: "STRING",
            description: "The hex code for the color, in the format #RRGGBB. For example: '#FF4500'.",
          },
        },
        required: ["name", "hex"],
      },
    },
  },
  required: ["name", "colors"],
}

const namePaletteSchema = {
  type: "OBJECT",
  properties: {
    name: {
      type: "STRING",
      description:
        "A creative and descriptive name for the color palette, between 2 to 4 words, based on the user's prompt and the provided colors. For example: 'Sunset Over the City' or 'Misty Forest Morning'.",
    },
    colors: {
      type: "ARRAY",
      description:
        "An array of exactly 8 colors. For each color, provide a descriptive name based on its hex code and the user's context prompt. DO NOT change the hex codes provided by the user.",
      items: {
        type: "OBJECT",
        properties: {
          name: {
            type: "STRING",
            description:
              "A descriptive name for the specific color. For example: 'Fiery Orange', 'Deep Teal', or 'Dusty Rose'.",
          },
          hex: {
            type: "STRING",
            description: "The original hex code for the color provided by the user.",
          },
        },
        required: ["name", "hex"],
      },
    },
  },
  required: ["name", "colors"],
}

export async function POST(request: NextRequest) {
  try {
    const API_KEY = process.env.GEMINI_API_KEY

    if (!API_KEY) {
      console.error("[Mood Palette] API request attempted without GEMINI_API_KEY configured")
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY not found in this environment",
          message:
            "If you're seeing this in the v0 preview, please add GEMINI_API_KEY in the Vars section. Your production site at moodpalette.carthaystudio.com is correctly configured.",
        },
        { status: 500 },
      )
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`

    const { type, prompt, colors } = await request.json()

    let apiPrompt: string
    let schema: any

    if (type === "prompt") {
      apiPrompt = `Generate a color palette based on the following theme: "${prompt}"`
      schema = paletteSchema
    } else if (type === "colors") {
      const colorList = colors.join(", ")
      apiPrompt = `I have extracted these colors from an image: [${colorList}]. The user provided this context: "${prompt}". Based on the context and the colors, generate a creative name for the whole palette and a descriptive name for each individual color. Return the names along with the original hex codes.`
      schema = namePaletteSchema
    } else {
      return NextResponse.json({ error: "Invalid request type" }, { status: 400 })
    }

    const body = {
      contents: [{ parts: [{ text: apiPrompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
        response_schema: schema,
      },
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[Mood Palette] Gemini API error (${response.status}):`, errorBody.substring(0, 200))

      if (response.status === 400) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your GEMINI_API_KEY in environment variables." },
          { status: 400 },
        )
      } else if (response.status === 429) {
        return NextResponse.json({ error: "API quota exceeded. Please try again later." }, { status: 429 })
      } else {
        return NextResponse.json({ error: "Failed to connect to Gemini API. Please try again." }, { status: 500 })
      }
    }

    const data = await response.json()
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!jsonText) {
      console.error("[Mood Palette] Invalid API response structure")
      return NextResponse.json({ error: "Received an invalid response from the API." }, { status: 500 })
    }

    const result = JSON.parse(jsonText)

    if (!result.colors || result.colors.length !== 8) {
      console.error(`[Mood Palette] API returned ${result.colors?.length || 0} colors instead of 8`)
      return NextResponse.json(
        { error: `API did not return the required 8 colors. Got: ${result.colors?.length || 0}` },
        { status: 500 },
      )
    }

    // Apply typographic punctuation enforcement
    const typographicResult: Palette = {
      name: applyTypography(result.name),
      colors: result.colors.map((c: any) => ({
        name: applyTypography(c.name),
        hex: c.hex,
      })),
    }

    return NextResponse.json(typographicResult)
  } catch (error: any) {
    console.error("[Mood Palette] Error in generate-palette API:", error.message)
    return NextResponse.json({ error: "Failed to generate palette. Please try again." }, { status: 500 })
  }
}
