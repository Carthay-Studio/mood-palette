"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import { hexToRgb, hexToHsl, hexToCmyk } from "../services/colorUtils"
import { Copy, Check } from "lucide-react"

interface ColorSwatchProps {
  name: string
  hex: string
  colorMode: "HEX" | "RGB" | "HSL" | "CMYK"
  onEdit: () => void
  onCopy: () => void
}

const isColorLight = (hex: string): boolean => {
  if (!hex || hex.length < 4) return false
  const color = hex.substring(1)
  const rgb = Number.parseInt(color, 16)
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luma > 180
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ name, hex, colorMode, onEdit, onCopy }) => {
  const textColor = useMemo(() => (isColorLight(hex) ? "text-black" : "text-white"), [hex])
  const [copied, setCopied] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<"idle" | "fadeOut" | "fadeIn">("idle")
  const [displayedValue, setDisplayedValue] = useState("")
  const [isActive, setIsActive] = useState(false)

  const calculatedValue = useMemo(() => {
    switch (colorMode) {
      case "RGB":
        return hexToRgb(hex)
      case "HSL":
        return hexToHsl(hex)
      case "CMYK":
        return hexToCmyk(hex)
      default:
        return hex.toUpperCase()
    }
  }, [hex, colorMode])

  useEffect(() => {
    if (displayedValue && displayedValue !== calculatedValue) {
      setAnimationPhase("fadeOut")
      const swapTimer = setTimeout(() => {
        setDisplayedValue(calculatedValue)
        setAnimationPhase("fadeIn")
      }, 200)
      const resetTimer = setTimeout(() => {
        setAnimationPhase("idle")
      }, 400)
      return () => {
        clearTimeout(swapTimer)
        clearTimeout(resetTimer)
      }
    } else if (!displayedValue) {
      setDisplayedValue(calculatedValue)
    }
  }, [calculatedValue, displayedValue])

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSwatchTap = () => {
    setIsActive(!isActive)
  }

  return (
    <div
      className={`group relative aspect-[4/5] cursor-pointer border-2 border-border overflow-hidden transition-transform duration-500 ease-carthay`}
      onClick={handleSwatchTap}
      data-active={isActive}
    >
      {/* Color Fill */}
      <div
        className="absolute inset-0 z-0 transition-all duration-700 group-hover:scale-110 ease-carthay"
        style={{ backgroundColor: hex }}
      />

      {/* Info Overlay - Always Visible */}
      <div
        className={`absolute inset-0 z-10 flex flex-col justify-between p-3 md:p-6 ${textColor} pointer-events-none transition-colors duration-700`}
      >
        {/* Header: Name */}
        <div className="flex items-center gap-2">
          <span
            className="font-ui text-sm md:text-lg leading-tight tracking-wide break-words flex-1 drop-shadow-md"
            title={name}
          >
            {name}
          </span>
        </div>

        {/* Footer: Value */}
        <div className="flex flex-col items-start w-full relative">
          <div className="h-[2px] w-8 bg-current mb-2 opacity-50"></div>
          <span
            className={`font-mono text-[10px] md:text-xs uppercase tracking-widest truncate w-full drop-shadow-md transition-all duration-200 ease-carthay ${
              animationPhase === "fadeOut"
                ? "opacity-0 translate-y-2"
                : animationPhase === "fadeIn"
                  ? "opacity-100 translate-y-0"
                  : "opacity-100 translate-y-0"
            }`}
          >
            {displayedValue}
          </span>
        </div>
      </div>

      {/* Action Buttons - Slide Up on Hover or Active State */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 z-20 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-data-[active=true]:translate-y-0 group-data-[active=true]:opacity-100 transition-all duration-500 ease-carthay pointer-events-auto">
        <div className="flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy()
            }}
            className="w-full py-2 md:py-3 bg-bg border-2 border-border text-text-primary font-mono text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-surface hover:border-accent transition-all duration-300 shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[44px]"
          >
            <div className="w-3 h-3 relative flex items-center justify-center flex-shrink-0">
              <Copy
                className={`w-3 h-3 absolute transition-all duration-500 ease-carthay ${copied ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}
              />
              <Check
                className={`w-3 h-3 absolute transition-all duration-500 ease-carthay ${copied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
              />
            </div>
            <div className="relative h-[1em] flex items-center ml-2">
              <span
                className={`whitespace-nowrap transition-all duration-500 ease-carthay ${copied ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}
              >
                Copy Value
              </span>
              <span
                className={`absolute inset-0 text-status-success whitespace-nowrap transition-all duration-500 ease-carthay ${copied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
              >
                COPIED
              </span>
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="w-full py-2 md:py-3 bg-bg border-2 border-border text-text-primary font-mono text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-surface hover:border-accent transition-all duration-300 shadow-2xl flex items-center justify-center gap-2 min-h-[44px]"
          >
            Edit Swatch
          </button>
        </div>
      </div>
    </div>
  )
}

export default ColorSwatch
