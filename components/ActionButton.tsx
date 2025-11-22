"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface ActionButtonProps {
  icon: React.ReactNode
  text: string
  onClick: () => void
  disabled?: boolean
  href?: string
  successMessage?: string
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, text, onClick, disabled = false, href, successMessage }) => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    if (successMessage) {
      setShowSuccessMessage(true)
      const timer = setTimeout(() => setShowSuccessMessage(false), 2000)
      return () => clearTimeout(timer)
    } else {
      setShowSuccessMessage(false)
    }
  }, [successMessage])

  const content = (
    <div className="flex items-center justify-center gap-3">
      {icon}
      <div className="grid place-items-center">
        <span
          className={`
            col-start-1 row-start-1
            transition-all duration-500 ease-carthay
            ${showSuccessMessage ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}
          `}
        >
          {text}
        </span>
        <span
          className={`
            col-start-1 row-start-1
            text-status-success
            transition-all duration-500 ease-carthay
            ${showSuccessMessage ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
          `}
        >
          COPIED
        </span>
      </div>
    </div>
  )

  const handleClick = () => {
    onClick()
  }

  // Strict Design Tokens
  // Using bg-bg (Void) to ensure border (surface-alt) is visible against the background.
  const className = `
    relative flex items-center justify-center px-6 py-4 min-h-[44px]
    font-mono text-[10px] uppercase tracking-widest
    bg-bg border-2 border-border text-text-muted
    hover:text-text-primary hover:border-accent hover:bg-surface
    active:scale-[0.98] hover:scale-[1.02]
    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-border
    transition-all duration-300 ease-out
    w-full md:w-auto
  `

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <button onClick={handleClick} disabled={disabled} className={className}>
      {content}
    </button>
  )
}

export default ActionButton
