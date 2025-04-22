"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function CounterCheckInPage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { toast } = useToast()
  const [bgImage, setBgImage] = useState<string>("/cerulean-flow.png") // Default image
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("Counter check-in page mounted")

    // Load background image from settings
    const loadBackgroundImage = async () => {
      try {
        console.log("Fetching background image")
        const response = await fetch("/api/settings/background")

        if (!response.ok) {
          console.error("Background image fetch failed:", response.status)
          throw new Error(`Failed to fetch background: ${response.status}`)
        }

        const data = await response.json()
        console.log("Background image data:", data)

        if (data.success && data.backgroundUrl) {
          console.log("Setting background image to:", data.backgroundUrl)
          setBgImage(data.backgroundUrl)
        } else {
          console.log("No background URL in response, using default")
          // Default background if no custom background is set
          setBgImage("/cerulean-flow.png")
        }
      } catch (error) {
        console.error("Error loading background image:", error)
        // Default background if there's an error
        setBgImage("/cerulean-flow.png")
      } finally {
        setIsLoading(false)
        console.log("Loading completed")
      }
    }

    loadBackgroundImage()

    // Set a timeout to ensure we don't get stuck in loading state
    const loadingTimeout = setTimeout(() => {
      console.log("Loading timeout triggered")
      setIsLoading(false)
    }, 3000) // 3 seconds max loading time

    return () => {
      clearTimeout(loadingTimeout)
    }
  }, [])

  const toggleFullScreen = () => {
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen()
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        ;(document.documentElement as any).webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      } else if ((document as any).webkitExitFullscreen) {
        ;(document as any).webkitExitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  const testCheckIn = () => {
    toast({
      title: "Success",
      description: (
        <div dangerouslySetInnerHTML={{ __html: "<br><br>Welcome!<br><br>Name: John Doe<br><br>Table: A1" }} />
      ),
      variant: "success",
      duration: 5000,
    })
  }

  // Show a simplified loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading check-in page...</p>
      </div>
    )
  }

  return (
    <>
      {/* Background div with inline style */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: -1,
        }}
      ></div>

      {/* Content */}
      <div className="min-h-screen w-full">
        <button
          className="fixed top-4 left-4 z-50 px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={toggleFullScreen}
        >
          Toggle Fullscreen
        </button>

        <div className="container flex flex-col items-center justify-center min-h-screen">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-2">Welcome to Check-in</h1>
            <p className="text-xl text-white drop-shadow-md">Scan your QR code to check in</p>
          </div>

          <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">QR Scanner will appear here</p>
              <div className="w-full h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <p className="text-gray-500">Camera placeholder</p>
              </div>
            </div>
          </div>

          <button
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-lg"
            onClick={testCheckIn}
          >
            Test Check-in
          </button>
        </div>
      </div>
    </>
  )
}
