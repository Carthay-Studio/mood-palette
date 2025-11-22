import type { Palette } from '../types';
import { applyTypography } from './textUtils';

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const paletteSchema = {
  type: "OBJECT",
  properties: {
    name: {
      type: "STRING",
      description: "A creative and descriptive name for the color palette, between 2 to 4 words. For example: 'Sunset Over the City' or 'Misty Forest Morning'."
    },
    colors: {
      type: "ARRAY",
      description: "An array of exactly 8 colors that make up the palette.",
      items: {
        type: "OBJECT",
        properties: {
          name: {
            type: "STRING",
            description: "A descriptive name for the specific color. For example: 'Fiery Orange', 'Deep Teal', or 'Dusty Rose'."
          },
          hex: {
            type: "STRING",
            description: "The hex code for the color, in the format #RRGGBB. For example: '#FF4500'."
          },
        },
        required: ["name", "hex"]
      }
    },
  },
  required: ["name", "colors"]
};

const namePaletteSchema = {
    type: "OBJECT",
    properties: {
        name: {
            type: "STRING",
            description: "A creative and descriptive name for the color palette, between 2 to 4 words, based on the user's prompt and the provided colors. For example: 'Sunset Over the City' or 'Misty Forest Morning'."
        },
        colors: {
            type: "ARRAY",
            description: "An array of exactly 8 colors. For each color, provide a descriptive name based on its hex code and the user's context prompt. DO NOT change the hex codes provided by the user.",
            items: {
                type: "OBJECT",
                properties: {
                    name: {
                        type: "STRING",
                        description: "A descriptive name for the specific color. For example: 'Fiery Orange', 'Deep Teal', or 'Dusty Rose'."
                    },
                    hex: {
                        type: "STRING",
                        description: "The original hex code for the color provided by the user."
                    },
                },
                required: ["name", "hex"]
            }
        },
    },
    required: ["name", "colors"]
}

const callApi = async (prompt: string, schema: any): Promise<Palette> => {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: schema,
    },
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("API Error Response:", errorBody);
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!jsonText) {
    console.error("Invalid API response structure:", data);
    throw new Error("Received an invalid response from the API.");
  }

  try {
    const result = JSON.parse(jsonText);
    if (!result.colors || result.colors.length !== 8) {
       throw new Error(`API did not return the required 8 colors. Got: ${result.colors?.length || 0}`);
    }
    
    // Apply typographic punctuation enforcement
    const typographicResult: Palette = {
        name: applyTypography(result.name),
        colors: result.colors.map((c: any) => ({
            name: applyTypography(c.name),
            hex: c.hex
        }))
    };

    return typographicResult;
  } catch (e) {
    console.error("Failed to parse JSON from API response:", jsonText);
    throw new Error("Received an invalid JSON response from the API.");
  }
};


export const generatePaletteFromPrompt = async (prompt: string): Promise<Palette> => {
    const apiPrompt = `Generate a color palette based on the following theme: "${prompt}"`;
    return callApi(apiPrompt, paletteSchema);
};

export const namePaletteFromColors = async (prompt: string, colors: string[]): Promise<Palette> => {
    const colorList = colors.join(', ');
    const apiPrompt = `I have extracted these colors from an image: [${colorList}]. The user provided this context: "${prompt}". Based on the context and the colors, generate a creative name for the whole palette and a descriptive name for each individual color. Return the names along with the original hex codes.`;
    return callApi(apiPrompt, namePaletteSchema);
}
