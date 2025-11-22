"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Palette } from "../types"
import { TrashIcon, ShareIcon, DownloadIcon } from "./icons"
import { createAseFile } from "../services/aseService"
import { encodePalette } from "../services/shareService"

interface SavedPalettesDrawerProps {
  isOpen: boolean
  onClose: () => void
  palettes: Palette[]
  onLoad: (palette: Palette) => void
  onDelete: (paletteName: string) => void
  buildNumber: string
}

const SavedPalettesDrawer: React.FC<SavedPalettesDrawerProps> = ({
  isOpen,
  onClose,
  palettes,
  onLoad,
  onDelete,
  buildNumber,
}) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [shouldRender, setShouldRender] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setIsClosing(false)
    } else if (shouldRender) {
      setIsClosing(true)
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 500) // Match animation duration exactly
      return () => clearTimeout(timer)
    }
  }, [isOpen, shouldRender])

  if (!shouldRender) return null

  const handleShare = (palette: Palette) => {
    const encoded = encodePalette(palette)
    const url = `${window.location.origin}${window.location.pathname}?palette=${encoded}`
    navigator.clipboard.writeText(url)
    setCopiedLink(palette.name)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleDownload = (palette: Palette) => {
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

  return (
    <div className="relative z-50">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
        onClick={onClose}
      />

      {/* Drawer - Inverted Modality (Light Mode) */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-modal-bg text-modal-text border-l-2 border-border flex flex-col shadow-none ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}`}
      >
        {/* Header - Editorial Style */}
        <div className="flex justify-between items-end p-12 border-b-2 border-modal-border shrink-0">
          <div className="space-y-4">
            <h2 className="font-product text-5xl font-light tracking-tight text-modal-text">Archive</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:opacity-50 transition-opacity">
            <span className="font-mono text-2xl leading-none text-modal-text">×</span>
          </button>
        </div>

        {/* List - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-12 space-y-12">
          {palettes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-modal-border opacity-50">
              <span className="font-mono text-xs uppercase tracking-widest text-center">
                Void
                <br />
                No Data
              </span>
            </div>
          ) : (
            palettes.map((palette) => (
              <div key={palette.name} className="group relative animate-fade-up">
                <div className="border-2 border-modal-border p-8 bg-white hover:border-modal-text transition-colors duration-700 ease-carthay">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="font-product text-3xl font-light tracking-wide text-modal-text break-words max-w-[70%]">
                      {palette.name}
                    </h3>
                    <div className="flex gap-2 shrink-0">
                      {/* Action Buttons */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShare(palette)
                        }}
                        className="text-modal-border hover:text-modal-text transition-colors"
                        title="Copy Link"
                      >
                        <ShareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(palette)
                        }}
                        className="text-modal-border hover:text-modal-text transition-colors"
                        title="Download ASE"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(palette.name)
                        }}
                        className="text-modal-border hover:text-status-error transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex h-12 w-full mb-8 border-2 border-modal-border relative">
                    {copiedLink === palette.name && (
                      <div className="absolute inset-0 bg-modal-text text-modal-bg flex items-center justify-center z-10 animate-fade-in">
                        <span className="font-mono text-[10px] uppercase tracking-widest">Link Copied</span>
                      </div>
                    )}
                    {palette.colors.map((c) => (
                      <div key={c.hex} className="h-full flex-1" style={{ backgroundColor: c.hex }}></div>
                    ))}
                  </div>

                  <button
                    onClick={() => onLoad(palette)}
                    className="w-full py-4 font-mono text-[10px] uppercase tracking-widest border-2 border-modal-border text-modal-text hover:bg-modal-text hover:text-modal-bg transition-all duration-500 ease-out"
                  >
                    Load Theme
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default SavedPalettesDrawer
