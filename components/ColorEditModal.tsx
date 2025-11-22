"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CloseIcon, CopyIcon, CheckIcon } from "./icons"
import { hexToRgb, hexToHsl, hexToCmyk } from "../services/colorUtils"
import { Pencil } from "lucide-react"

interface ColorEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  initialHex: string
  onSave: (newName: string, newHex: string) => void
}

const ColorEditModal: React.FC<ColorEditModalProps> = ({ open, onOpenChange, initialName, initialHex, onSave }) => {
  const [editName, setEditName] = useState(initialName)
  const [editHex, setEditHex] = useState(initialHex)
  const [copied, setCopied] = useState(false)
  const [colorMode] = useState<"HEX" | "RGB" | "HSL" | "CMYK">("HEX")

  useEffect(() => {
    if (open) {
      setEditName(initialName)
      setEditHex(initialHex)
      setCopied(false)
    }
  }, [open, initialName, initialHex])

  if (!open) return null

  const handleCopy = () => {
    let valToCopy = editHex.toUpperCase()
    if (colorMode === "RGB") valToCopy = hexToRgb(editHex)
    if (colorMode === "HSL") valToCopy = hexToHsl(editHex)
    if (colorMode === "CMYK") valToCopy = hexToCmyk(editHex)

    navigator.clipboard.writeText(valToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    onSave(editName, editHex)
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const displayedValue = () => {
    switch (colorMode) {
      case "RGB":
        return hexToRgb(editHex)
      case "HSL":
        return hexToHsl(editHex)
      case "CMYK":
        return hexToCmyk(editHex)
      default:
        return editHex.toUpperCase()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={handleClose} />

      {/* Modal - Inverted Modality (Light Mode) */}
      <div className="relative bg-modal-bg border-2 border-modal-border text-modal-text w-full max-w-md p-8 md:p-12 animate-fade-up shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Color Calibration</span>
            <h2 className="font-product text-4xl font-light tracking-tight">Options</h2>
          </div>
          <button onClick={handleClose} className="hover:opacity-50 transition-opacity">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-gray-500 block flex items-center gap-2">
              Color Identity
              <Pencil className="w-3 h-3 opacity-40" />
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-transparent border-b-2 border-modal-border py-2 font-product text-2xl focus:outline-none focus:border-modal-text transition-colors text-modal-text placeholder-gray-300"
              placeholder="Color Name"
            />
          </div>

          {/* Visual + Picker */}
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-gray-500 block">Tune & Sample</label>
            <div className="flex gap-4">
              <div className="flex-1 h-24 border-2 border-modal-border relative group cursor-pointer">
                <input
                  type="color"
                  value={editHex}
                  onChange={(e) => setEditHex(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute inset-0" style={{ backgroundColor: editHex }}></div>
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="font-mono text-[10px] text-white uppercase tracking-widest">Refine</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center items-start space-y-2">
                <span className="font-mono text-xs md:text-sm break-all">{displayedValue()}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-modal-text transition-colors"
                >
                  {copied ? <CheckIcon className="w-3 h-3 text-status-success" /> : <CopyIcon className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy Value"}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-8 border-t-2 border-modal-border flex justify-end gap-4">
            <button
              onClick={handleClose}
              className="px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:text-modal-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-modal-text text-modal-bg font-mono text-[10px] uppercase tracking-widest border-2 border-modal-text hover:bg-transparent hover:text-modal-text transition-all duration-300"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColorEditModal
