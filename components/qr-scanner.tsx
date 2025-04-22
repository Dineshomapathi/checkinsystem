"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Camera, CameraOff } from "lucide-react"

interface QrScannerProps {
  onScan: (result: string) => void
}

export function QrScanner({ onScan }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "qr-reader"

  useEffect(() => {
    // Initialize scanner
    scannerRef.current = new Html5Qrcode(scannerContainerId)

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices)
          // Select the back camera by default (if available)
          const backCamera = devices.find(
            (camera) => camera.label.toLowerCase().includes("back") || camera.label.toLowerCase().includes("rear"),
          )
          setSelectedCamera(backCamera ? backCamera.id : devices[0].id)
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err)
        setError("Unable to access camera. Please ensure you have granted camera permissions.")
      })

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((error) => {
          console.error("Error stopping scanner:", error)
        })
      }
    }
  }, [])

  const startScanner = async () => {
    if (!scannerRef.current || !selectedCamera) return

    setError(null)
    setIsScanning(true)

    try {
      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log("QR code scanned:", decodedText)

          // Clean up the scanned text (remove any whitespace, newlines, etc.)
          const cleanedText = decodedText.trim()

          // Handle the scanned code
          onScan(cleanedText)

          // Pause scanning for 5 seconds
          if (scannerRef.current) {
            scannerRef.current.pause(true)
            setTimeout(() => {
              if (scannerRef.current) {
                scannerRef.current.resume()
              }
            }, 5000)
          }
        },
        (errorMessage) => {
          // Log QR scan errors but don't display to user unless it's critical
          if (errorMessage.includes("No MultiFormat Readers were able to detect the code")) {
            // This is a common error when the camera is searching for a QR code
            console.log("Still searching for QR code...")
          } else {
            console.error("QR scan error:", errorMessage)
          }
        },
      )
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to start camera. Please ensure you have granted camera permissions."
      setError(errorMessage)
      setIsScanning(false)
      console.error("Error starting scanner:", err)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
        setIsScanning(false)
      } catch (error) {
        console.error("Error stopping scanner:", error)
      }
    }
  }

  const switchCamera = async () => {
    // First stop the current scanner
    if (isScanning) {
      await stopScanner()
    }

    // Find the next camera in the list
    if (cameras.length > 1 && selectedCamera) {
      const currentIndex = cameras.findIndex((camera) => camera.id === selectedCamera)
      const nextIndex = (currentIndex + 1) % cameras.length
      setSelectedCamera(cameras[nextIndex].id)

      // Restart the scanner with the new camera
      setTimeout(() => {
        if (!isScanning) {
          startScanner()
        }
      }, 500)
    }
  }

  return (
    <div className="space-y-4">
      <div id={scannerContainerId} className="w-full h-[300px] bg-black rounded-lg overflow-hidden"></div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        {!isScanning ? (
          <Button onClick={startScanner} className="flex items-center">
            <Camera className="mr-2 h-4 w-4" />
            Start Scanner
          </Button>
        ) : (
          <Button variant="outline" onClick={stopScanner} className="flex items-center">
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Scanner
          </Button>
        )}

        {cameras.length > 1 && (
          <Button variant="outline" onClick={switchCamera}>
            Switch Camera
          </Button>
        )}
      </div>

      {cameras.length > 0 && selectedCamera && (
        <p className="text-xs text-muted-foreground">
          Using camera: {cameras.find((c) => c.id === selectedCamera)?.label || "Unknown"}
        </p>
      )}

      <div className="text-sm text-muted-foreground">
        <p>Position the QR code within the scanner area.</p>
        <p>Make sure the code is well-lit and not blurry.</p>
      </div>
    </div>
  )
}
