"use client"

import type React from "react"
import { useRef, useState, useCallback, useEffect } from "react"
import { CameraIcon } from "./icons"

interface CameraCaptureProps {
  onImageSelected: (file: File) => void
  preview?: string | null
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onImageSelected, preview }) => {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const startCamera = useCallback(async () => {
    stopCamera()
    setError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      })
      setStream(mediaStream)
    } catch (err) {
      console.warn("Could not get camera with specific facing mode, trying default:", err)
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
        setStream(mediaStream)
      } catch (finalErr) {
        console.error("Error accessing any camera:", finalErr)
        setError("Camera unavailable. Check permissions.")
      }
    }
  }, [stopCamera, facingMode])

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "capture.png", { type: "image/png" })
            onImageSelected(file)
          }
        }, "image/png")
      }
    }
  }

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
  }

  // React to facing mode change by restarting camera if active
  useEffect(() => {
    if (stream) {
      startCamera()
    }
  }, [facingMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // State 1: Stream Active
  if (stream) {
    return (
      <div className="flex flex-col w-full gap-4">
        <div
          className="relative w-full border-2 border-border bg-black overflow-hidden group"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Live camera feed - always active */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${preview ? "opacity-0" : "opacity-100"}`}
          />

          {/* Preview overlay when image is captured */}
          {preview && (
            <div className="absolute inset-0 z-10">
              <img
                src={preview || "/placeholder.svg"}
                alt="Capture Preview"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-carthay"
              />
              <div className="absolute inset-0 bg-bg/40 group-hover:bg-bg/20 transition-colors duration-700"></div>

              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div className="border-2 border-border bg-bg px-4 py-2 shadow-xl">
                  <span className="block font-mono text-[10px] text-text-primary uppercase tracking-widest">
                    Source Acquired
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Camera frame markers */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
            <div className="flex justify-between">
              <div className="w-4 h-4 border-t-2 border-l-2 border-white/50"></div>
              <div className="w-4 h-4 border-t-2 border-r-2 border-white/50"></div>
            </div>
            <div className="flex justify-between">
              <div className="w-4 h-4 border-b-2 border-l-2 border-white/50"></div>
              <div className="w-4 h-4 border-b-2 border-r-2 border-white/50"></div>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        {/* Controls - always available for retakes */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={toggleFacingMode}
            className="px-6 py-4 bg-bg border-2 border-border text-text-muted hover:text-text-primary hover:border-accent hover:bg-surface transition-all duration-300 font-mono text-[10px] uppercase tracking-widest"
          >
            Flip Camera
          </button>

          <button
            onClick={takePicture}
            className="flex-1 py-4 bg-bg border-2 border-border text-text-primary hover:bg-surface hover:border-accent hover:shadow-[0_0_15px_-5px_rgba(255,255,255,0.2)] transition-all duration-300 font-mono text-[10px] uppercase tracking-widest"
          >
            {preview ? "Retake" : "Capture"}
          </button>
        </div>
      </div>
    )
  }

  // State 2: Preview (Source Acquired)
  if (preview) {
    return (
      <div
        className="relative w-full border-2 border-border bg-bg overflow-hidden group cursor-pointer"
        style={{ aspectRatio: "16/9" }}
        onClick={startCamera}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={preview || "/placeholder.svg"}
            alt="Capture Preview"
            className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700 ease-carthay"
          />
          <div className="absolute inset-0 bg-bg/40 group-hover:bg-bg/20 transition-colors duration-700"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className="border-2 border-border bg-bg px-4 py-2 shadow-xl">
            <span className="block font-mono text-[10px] text-text-primary uppercase tracking-widest">
              Source Acquired
            </span>
          </div>
          <span className="font-mono text-[10px] text-text-primary/70 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
            Tap to Retake
          </span>
        </div>
      </div>
    )
  }

  // State 3: Idle (Initialize)
  return (
    <div
      onClick={startCamera}
      className="flex flex-col items-center justify-center w-full border-2 border-border bg-bg hover:bg-surface hover:border-text-muted transition-all duration-500 cursor-pointer group"
      style={{ aspectRatio: "16/9" }}
    >
      {error ? (
        <p className="text-status-error font-mono text-xs uppercase tracking-widest text-center max-w-xs px-4">
          {error}
        </p>
      ) : (
        <div className="flex flex-col items-center justify-center text-text-muted space-y-4 group-hover:text-text-primary transition-colors">
          <CameraIcon className="w-8 h-8" />
          <div className="text-center">
            <span className="block font-mono text-[10px] uppercase tracking-widest">Initialize Camera</span>
            <span className="block font-ui font-light text-sm text-text-muted/50 mt-1">Tap to grant access</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CameraCapture
