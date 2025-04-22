"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QrScanner } from "@/components/qr-scanner"
import { CheckInResult } from "@/components/check-in-result"
import { useToast } from "@/hooks/use-toast"
import { Maximize, Minimize } from "lucide-react"

export default function CheckInPage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [scanResult, setScanResult] = useState<null | {
    success: boolean
    message: string
    registration?: {
      full_name: string
      company?: string
      table_number?: string
    }
  }>(null)
  const { toast } = useToast()

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast({
          title: "Error",
          description: `Error attempting to enable fullscreen: ${err.message}`,
          variant: "destructive",
        })
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const handleQrCodeScanned = async (scannedText: string) => {
    try {
      console.log("QR code scanned, sending to API:", scannedText)

      // In a real app, this would be an API call to your backend
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qr_code: scannedText }),
      })

      console.log("API response status:", response.status)
      const data = await response.json()
      console.log("API response data:", data)

      setScanResult(data)

      if (data.success) {
        toast({
          title: "Success",
          description: `Welcome, ${data.registration.full_name}!`,
        })
      } else if (data.message && data.message.includes("Already checked in")) {
        toast({
          title: "Already Checked In",
          description: data.registration
            ? `${data.registration.full_name} is already checked in.`
            : "This person is already checked in.",
          variant: "warning",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Invalid QR Code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing check-in:", error)
      toast({
        title: "Error",
        description: "Failed to process check-in. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTestCheckIn = () => {
    // Use one of the hashes from your Excel file for testing
    handleQrCodeScanned("FZM05VLl/oKbMzIL02MlqNE9Cn4=")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Event Check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between">
            <Button onClick={toggleFullScreen} className="flex items-center">
              {isFullscreen ? (
                <>
                  <Minimize className="mr-2 h-4 w-4" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize className="mr-2 h-4 w-4" />
                  Enter Fullscreen
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleTestCheckIn}>
              Test Check-in
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <QrScanner onScan={handleQrCodeScanned} />
          </div>

          {scanResult && <CheckInResult result={scanResult} />}
        </CardContent>
      </Card>
    </div>
  )
}
