"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import type { Palette } from "./types"
import { generatePaletteFromPrompt, namePaletteFromColors } from "./services/geminiService"
import { createAseFile } from "./services/aseService"
import { encodePalette, decodePalette } from "./services/shareService"
import { hexToRgb, hexToHsl, hexToCmyk } from "./services/colorUtils"

import ColorSwatch from "./components/ColorSwatch"
import ActionButton from "./components/ActionButton"
import SavedPalettesDrawer from "./components/SavedPalettesDrawer"
import ImageUpload from "./components/ImageUpload"
import CameraCapture from "./components/CameraCapture"
import ColorEditModal from "./components/ColorEditModal"
import { SaveIcon, DownloadIcon, ShareIcon, PaletteIcon, CoffeeIcon } from "./components/icons"
import { Pencil } from "lucide-react"

import ColorThief from "colorthief"

const LOCAL_STORAGE_KEY = "saved-color-palettes"
const BUILD_NUMBER = `v0.${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")}`

const defaultPalette: Palette = {
  name: "Synthetic Sustenance",
  colors: [
    { name: "Synthetic Green", hex: "#5E7A45" },
    { name: "Processed Sludge", hex: "#4F593F" },
    { name: "Rust Belt", hex: "#784432" },
    { name: "Hazy Atmosphere", hex: "#6A7B7D" },
    { name: "Bleak Concrete", hex: "#9CA8AC" },
    { name: "Faded Vitality", hex: "#C8C2B5" },
    { name: "Shadowed Abyss", hex: "#36453A" },
    { name: "Corroded Metal", hex: "#545C51" },
  ],
}

type AppMode = "prompt" | "image" | "camera"
type ColorMode = "HEX" | "RGB" | "HSL" | "CMYK"

const App: React.FC = () => {
  const [promptModePalette, setPromptModePalette] = useState<Palette | null>(null)
  const [imageModePalette, setImageModePalette] = useState<Palette | null>(null)
  const [cameraModePalette, setCameraModePalette] = useState<Palette | null>(null)

  const [prompt, setPrompt] = useState("")
  const [imagePrompt, setImagePrompt] = useState("")
  const [cameraPrompt, setCameraPrompt] = useState("")

  const [imagePreview, setImagePreview] = useState<{ src: string; colors: string[] } | null>(null)
  const [cameraPreview, setCameraPreview] = useState<{ src: string; colors: string[] } | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("Initial Sequence")
  const [error, setError] = useState<string | null>(null)
  const [savedPalettes, setSavedPalettes] = useState<Palette[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [shareMessage, setShareMessage] = useState<string>("")
  const [activeMode, setActiveMode] = useState<AppMode>("prompt")
  const [colorMode, setColorMode] = useState<ColorMode>("HEX")

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null)

  const colorThief = useRef<ColorThief | null>(null)
  if (!colorThief.current) {
    colorThief.current = new ColorThief()
  }

  const palette = useMemo(() => {
    if (activeMode === "prompt") return promptModePalette
    if (activeMode === "image") return imageModePalette
    if (activeMode === "camera") return cameraModePalette
    return null
  }, [activeMode, promptModePalette, imageModePalette, cameraModePalette])

  const setPalette = useCallback(
    (p: Palette | null) => {
      if (activeMode === "prompt") setPromptModePalette(p)
      if (activeMode === "image") setImageModePalette(p)
      if (activeMode === "camera") setCameraModePalette(p)
    },
    [activeMode],
  )

  const updatePaletteName = (newName: string) => {
    if (!palette) return
    const updated = { ...palette, name: newName }
    setPalette(updated)
  }

  const handleColorSave = (newName: string, newHex: string) => {
    if (!palette || editingColorIndex === null) return
    const updatedColors = [...palette.colors]
    updatedColors[editingColorIndex] = { name: newName, hex: newHex }
    setPalette({ ...palette, colors: updatedColors })
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) setSavedPalettes(JSON.parse(saved))
    } catch (e) {}

    const urlParams = new URLSearchParams(window.location.search)
    const sharedData = urlParams.get("palette")
    if (sharedData) {
      const decodedPalette = decodePalette(sharedData)
      if (decodedPalette) {
        setPromptModePalette(decodedPalette)
        setLoading(false)
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } else {
      generateInitialPalette()
    }
  }, [])

  const generateInitialPalette = async () => {
    setLoading(true)
    setLoadingMessage("Initializing Surface")
    setError(null)
    try {
      const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })
      const initialPrompt = `Generate a creative color palette inspired by a fun, optimistic, or notable event associated with today's date, ${today}. Give the palette a creative name.`
      const newPalette = await generatePaletteFromPrompt(initialPrompt)
      setPromptModePalette(newPalette)
    } catch (err: any) {
      const errorMessage = err.message?.includes("API key")
        ? "API key issue. Check console for details."
        : "Could not generate today's palette. Here's a default one!"
      setError(errorMessage)
      setPromptModePalette(defaultPalette)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    const currentPrompt = activeMode === "prompt" ? prompt : activeMode === "image" ? imagePrompt : cameraPrompt
    const currentPreview = activeMode === "image" ? imagePreview : cameraPreview

    if (loading) return
    if (activeMode === "prompt" && !currentPrompt.trim()) return
    if (activeMode !== "prompt" && !currentPreview) return

    setLoading(true)
    setLoadingMessage("Fabricating...")
    setError(null)
    setPalette(null)

    try {
      let newPalette: Palette
      if (activeMode === "prompt") {
        newPalette = await generatePaletteFromPrompt(currentPrompt)
      } else if (currentPreview) {
        newPalette = await namePaletteFromColors(currentPrompt, currentPreview.colors)
      } else {
        throw new Error("No image selected for color extraction.")
      }
      setPalette(newPalette)
    } catch (err: any) {
      const errorMessage = err.message?.includes("API key")
        ? "API configuration error. Check your setup."
        : err.message || "Failed to generate palette."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelected = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const extracted = colorThief.current
          .getPalette(img, 8)
          .map((rgb: number[]) => `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`)
        const preview = { src: imageSrc, colors: extracted }
        if (activeMode === "image") setImagePreview(preview)
        if (activeMode === "camera") setCameraPreview(preview)
      }
      img.src = imageSrc
    }
    reader.readAsDataURL(file)
  }

  const isPaletteSaved = useMemo(() => {
    if (!palette) return false
    return savedPalettes.some((p) => p.name === palette.name)
  }, [palette, savedPalettes])

  const handleDownloadAse = () => {
    if (!palette) return
    const blob = createAseFile(palette)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${palette.name.replace(/\s/g, "_")}.ase`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = () => {
    if (!palette) return
    const encoded = encodePalette(palette)
    const url = `${window.location.origin}${window.location.pathname}?palette=${encoded}`
    navigator.clipboard.writeText(url)
    setShareMessage("COPIED")
    setTimeout(() => setShareMessage(""), 2000)
  }

  const handleSavePalette = () => {
    if (!palette || isPaletteSaved) return
    const newSavedPalettes = [palette, ...savedPalettes]
    setSavedPalettes(newSavedPalettes)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSavedPalettes))
  }

  const handleDeletePalette = (paletteName: string) => {
    const newSavedPalettes = savedPalettes.filter((p) => p.name !== paletteName)
    setSavedPalettes(newSavedPalettes)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSavedPalettes))
  }

  const handleLoadPalette = (p: Palette) => {
    setPromptModePalette(p)
    setActiveMode("prompt")
    setIsDrawerOpen(false)
  }

  const backgroundStyle = useMemo(() => {
    if (!palette || palette.colors.length < 2) {
      return { background: "#0C0C0C" }
    }
    const c1 = palette.colors[0].hex
    const c2 = palette.colors[palette.colors.length - 1].hex

    return {
      background: `linear-gradient(135deg, ${c1}60 0%, ${c2}60 100%)`,
      backgroundColor: "#0C0C0C",
    }
  }, [palette])

  if (loading && !palette) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bg p-4 animate-fade-in">
        <div className="border-2 border-surface-alt p-12 md:p-24 flex flex-col items-center justify-center space-y-8 max-w-lg w-full relative bg-surface overflow-hidden">
          <span className="font-brand text-2xl text-text-muted">Carthay Studio</span>
          <h1 className="font-product italic text-5xl md:text-6xl text-text-primary tracking-tight text-center">
            Mood Palette
          </h1>
          <div className="w-24 h-[2px] bg-surface-alt"></div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-center text-text-primary animate-pulse-slow">
            Loading Palette Engine
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      style={backgroundStyle}
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-16 pb-12 font-ui transition-all duration-1000 ease-carthay relative overflow-x-hidden"
    >
      <div className="w-full max-w-6xl bg-surface/90 backdrop-blur-sm border-2 border-border p-6 md:p-12 relative animate-fade-up mb-8 flex-1">
        <div className="flex justify-between items-center mb-6 border-b-2 border-border pb-6">
          <h1 className="text-3xl md:text-4xl font-product italic text-text-primary tracking-tight leading-none">
            Mood Palette
          </h1>
          <span className="font-brand text-xl md:text-2xl text-white tracking-normal">Carthay Studio</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {(["prompt", "image", "camera"] as AppMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`
                                py-3 font-mono uppercase text-[10px] tracking-widest transition-all duration-300 border-2
                                ${
                                  activeMode === mode
                                    ? "bg-surface border-text-primary text-text-primary shadow-[0_0_15px_-5px_rgba(255,255,255,0.1)]"
                                    : "bg-bg border-border text-text-muted hover:border-text-muted hover:text-text-secondary"
                                }
                            `}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="mb-4">
          {activeMode === "prompt" && (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a mood, a scene, or a concept..."
              className="w-full h-32 bg-bg border-2 border-border p-6 text-xl md:text-2xl text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors duration-300"
            />
          )}

          {activeMode === "image" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUpload onImageSelected={handleImageSelected} preview={imagePreview?.src} />
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Add context..."
                className="w-full h-full bg-bg border-2 border-border p-6 text-xl text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors duration-300"
              />
            </div>
          )}

          {activeMode === "camera" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CameraCapture onImageSelected={handleImageSelected} preview={cameraPreview?.src} />
              <textarea
                value={cameraPrompt}
                onChange={(e) => setCameraPrompt(e.target.value)}
                placeholder="Add context..."
                className="w-full h-full bg-bg border-2 border-border p-6 text-xl text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors duration-300"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center mb-8">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`
                            w-full py-6 text-xs font-mono uppercase tracking-[0.2em] text-text-primary 
                            bg-bg border-2 border-border 
                            hover:bg-surface hover:border-accent hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.2)]
                            transition-all duration-500 focus:outline-none 
                            disabled:opacity-50 disabled:cursor-not-allowed 
                            relative overflow-hidden group
                            ${loading ? "animate-glow shadow-[0_0_50px_-10px_rgba(255,255,255,0.5)] border-accent" : ""}
                        `}
          >
            <span className="relative z-10">{loading ? loadingMessage : "Generate Palette"}</span>
            {loading && <div className="absolute inset-0 bg-white/5 animate-pulse-slow"></div>}
          </button>

          {error && <p className="mt-6 font-mono text-xs text-status-error uppercase tracking-widest">{error}</p>}

          {((imagePreview && activeMode === "image") || (cameraPreview && activeMode === "camera")) && !palette && (
            <div className="mt-8 w-full border-t-2 border-border pt-8">
              <p className="text-center font-mono text-[10px] text-text-muted uppercase tracking-widest mb-4">
                Raw Data Extraction
              </p>
              <div className="flex justify-center gap-4">
                {((activeMode === "image" ? imagePreview : cameraPreview)?.colors || []).map((color, index) => (
                  <div key={index} style={{ backgroundColor: color }} className="h-4 w-4 border border-white/10"></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {palette && !loading && (
          <div className="animate-fade-up">
            <div className="mb-8 flex flex-col items-start gap-6">
              <div className="w-full">
                <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted block mb-2">
                  Palette Identity
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={palette.name}
                    onChange={(e) => updatePaletteName(e.target.value)}
                    className="w-full text-3xl md:text-5xl font-sans text-text-primary bg-transparent border-b-2 border-border focus:border-accent focus:outline-none transition-colors pb-2 pr-16 tracking-normal break-words"
                    style={{ fontSize: "clamp(24px, 5vw, 48px)" }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="text"]') as HTMLInputElement
                      input?.focus()
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center opacity-40 group-hover:opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="Edit palette name"
                  >
                    <Pencil className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>

              <div className="w-full">
                <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted block mb-2">
                  Output Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["HEX", "RGB", "HSL", "CMYK"] as ColorMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setColorMode(mode)}
                      className={`min-w-[60px] min-h-[44px] px-4 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors border-2 ${colorMode === mode ? "border-text-primary text-text-primary bg-surface" : "border-border text-text-muted hover:border-text-muted bg-bg"}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-border mb-8">
              {palette.colors.map((color, index) => (
                <ColorSwatch
                  key={`${color.hex}-${index}`}
                  name={color.name}
                  hex={color.hex}
                  colorMode={colorMode}
                  onEdit={() => {
                    setEditingColorIndex(index)
                    setEditModalOpen(true)
                  }}
                  onCopy={() => {
                    // Copy color value to clipboard
                    let valueToCopy = color.hex.toUpperCase()

                    switch (colorMode) {
                      case "RGB":
                        valueToCopy = hexToRgb(color.hex)
                        break
                      case "HSL":
                        valueToCopy = hexToHsl(color.hex)
                        break
                      case "CMYK":
                        valueToCopy = hexToCmyk(color.hex)
                        break
                    }

                    navigator.clipboard.writeText(valueToCopy)
                  }}
                />
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <ActionButton icon={<ShareIcon />} text="Share" onClick={handleShare} successMessage={shareMessage} />
              <ActionButton icon={<DownloadIcon />} text="ASE" onClick={handleDownloadAse} />
              <ActionButton
                icon={<SaveIcon />}
                text={isPaletteSaved ? "Saved" : "Save"}
                onClick={handleSavePalette}
                disabled={isPaletteSaved}
              />
              <ActionButton icon={<PaletteIcon />} text="PALETTES" onClick={() => setIsDrawerOpen(true)} />
              <ActionButton
                icon={<CoffeeIcon />}
                text="Tip Jar"
                onClick={() => {}}
                href="https://ko-fi.com/carthaystudio"
              />
            </div>
          </div>
        )}

        <div className="hidden md:block">
          <SavedPalettesDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            palettes={savedPalettes}
            onLoad={handleLoadPalette}
            onDelete={handleDeletePalette}
            buildNumber={BUILD_NUMBER}
          />
        </div>

        <div className="md:hidden">
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
                onClick={() => setIsDrawerOpen(false)}
              />
              <div className="relative w-full max-w-lg max-h-[90vh] bg-modal-bg border-2 border-modal-border animate-fade-up overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b-2 border-modal-border shrink-0">
                  <h2 className="font-product text-3xl font-light text-modal-text">Archive</h2>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:opacity-50 transition-opacity">
                    <span className="font-mono text-2xl leading-none text-modal-text">×</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {savedPalettes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-modal-border opacity-50">
                      <span className="font-mono text-xs uppercase tracking-widest text-center">
                        Void
                        <br />
                        No Data
                      </span>
                    </div>
                  ) : (
                    savedPalettes.map((palette) => (
                      <div key={palette.name} className="border-2 border-modal-border p-4 bg-white">
                        <h3 className="font-product text-2xl font-light text-modal-text mb-4 break-words">
                          {palette.name}
                        </h3>
                        <div className="flex h-10 w-full mb-4 border-2 border-modal-border">
                          {palette.colors.map((c) => (
                            <div key={c.hex} className="h-full flex-1" style={{ backgroundColor: c.hex }}></div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            handleLoadPalette(palette)
                            setIsDrawerOpen(false)
                          }}
                          className="w-full py-3 font-mono text-[10px] uppercase tracking-widest border-2 border-modal-border text-modal-text hover:bg-modal-text hover:text-modal-bg transition-all"
                        >
                          Load Theme
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t-2 border-border flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-[10px] text-text-muted uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-4">
            <span>Carthay Studio</span>
            <span>Build {BUILD_NUMBER}</span>
            <span className="text-[9px]">Powered by Gemini</span>
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
            <a
              href="https://carthaystudio.com"
              target="_blank"
              rel="noreferrer"
              className="md:hover:text-text-primary transition-colors text-center py-3 md:py-0 border-2 md:border-0 border-border md:border-transparent hover:border-text-muted"
            >
              Contact
            </a>
            <a
              href="https://github.com/Carthay-Studio/mood-palette"
              target="_blank"
              rel="noreferrer"
              className="md:hover:text-text-primary transition-colors text-center py-3 md:py-0 border-2 md:border-0 border-border md:border-transparent hover:border-text-muted"
            >
              GitHub
            </a>
            <a
              href="https://www.instagram.com/carthay_studio/"
              target="_blank"
              rel="noreferrer"
              className="md:hover:text-text-primary transition-colors text-center py-3 md:py-0 border-2 md:border-0 border-border md:border-transparent hover:border-text-muted"
            >
              Instagram
            </a>
            <a
              href="https://github.com/Carthay-Studio/mood-palette/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
              className="md:hover:text-text-primary transition-colors text-center py-3 md:py-0 border-2 md:border-0 border-border md:border-transparent hover:border-text-muted"
            >
              License
            </a>
          </div>
        </div>
      </div>

      <ColorEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        initialName={editingColorIndex !== null ? palette?.colors[editingColorIndex]?.name || "" : ""}
        initialHex={editingColorIndex !== null ? palette?.colors[editingColorIndex]?.hex || "" : ""}
        onSave={handleColorSave}
      />
    </div>
  )
}

export default App
