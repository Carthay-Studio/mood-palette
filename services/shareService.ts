import pako from "pako"
import type { Palette } from "../types"

const base64UrlEncode = (bytes: Uint8Array): string => {
  const base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
  let result = ""

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i]
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0

    result += base64chars[byte1 >> 2]
    result += base64chars[((byte1 & 3) << 4) | (byte2 >> 4)]
    result += i + 1 < bytes.length ? base64chars[((byte2 & 15) << 2) | (byte3 >> 6)] : ""
    result += i + 2 < bytes.length ? base64chars[byte3 & 63] : ""
  }

  return result
}

const base64UrlDecode = (str: string): Uint8Array => {
  const base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
  const lookup = new Uint8Array(256)
  for (let i = 0; i < base64chars.length; i++) {
    lookup[base64chars.charCodeAt(i)] = i
  }

  const bytes = new Uint8Array((str.length * 3) / 4)
  let byteIndex = 0

  for (let i = 0; i < str.length; i += 4) {
    const encoded1 = lookup[str.charCodeAt(i)]
    const encoded2 = lookup[str.charCodeAt(i + 1)]
    const encoded3 = i + 2 < str.length ? lookup[str.charCodeAt(i + 2)] : 0
    const encoded4 = i + 3 < str.length ? lookup[str.charCodeAt(i + 3)] : 0

    bytes[byteIndex++] = (encoded1 << 2) | (encoded2 >> 4)
    if (i + 2 < str.length) bytes[byteIndex++] = ((encoded2 & 15) << 4) | (encoded3 >> 2)
    if (i + 3 < str.length) bytes[byteIndex++] = ((encoded3 & 3) << 6) | encoded4
  }

  return bytes.slice(0, byteIndex)
}

export const encodePalette = (palette: Palette): string => {
  try {
    const jsonString = JSON.stringify(palette)
    const compressed = pako.deflate(jsonString)
    return base64UrlEncode(compressed)
  } catch (e) {
    console.error("Failed to encode palette", e)
    return ""
  }
}

export const decodePalette = (encoded: string): Palette | null => {
  try {
    const compressed = base64UrlDecode(encoded)
    const jsonString = pako.inflate(compressed, { to: "string" })
    return JSON.parse(jsonString) as Palette
  } catch (e) {
    console.error("Failed to decode palette", e)
    return null
  }
}
