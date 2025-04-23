"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, Copy, Calendar, AlertTriangle } from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"
import { PurgeSystemDialog } from "@/components/purge-system-dialog"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const [backgroundImage, setBackgroundImage] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [baseUrl, setBaseUrl] = useState("")
  const { toast } = useToast()
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false)

  // Simulation settings
  const [simulationEnabled, setSimulationEnabled] = useState(false)
  const [dateOffset, setDateOffset] = useState(0)
  const [currentDate, setCurrentDate] = useState("")
  const [actualDate, setActualDate] = useState("")
  const [isLoadingSimulation, setIsLoadingSimulation] = useState(false)
  const [isSavingSimulation, setIsSavingSimulation] = useState(false)

  useEffect(() => {
    // Set base URL
    setBaseUrl(window.location.origin)

    // Load current settings
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings/background")
        const data = await response.json()

        if (data.success && data.backgroundUrl) {
          setBackgroundImage(data.backgroundUrl)
        }

        // Load simulation settings
        await loadSimulationSettings()
      } catch (error) {
        console.error("Error loading settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [toast])

  const loadSimulationSettings = async () => {
    try {
      setIsLoadingSimulation(true)
      const response = await fetch("/api/settings/simulation")
      const data = await response.json()

      if (data.success) {
        setSimulationEnabled(data.settings.enabled)
        setDateOffset(data.settings.dateOffset)
        setCurrentDate(data.currentDate)
        setActualDate(data.actualDate)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load simulation settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading simulation settings:", error)
      toast({
        title: "Error",
        description: "Failed to load simulation settings",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSimulation(false)
    }
  }

  const saveSimulationSettings = async () => {
    try {
      setIsSavingSimulation(true)
      const response = await fetch("/api/settings/simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: simulationEnabled,
          dateOffset: dateOffset,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentDate(data.currentDate)
        setActualDate(data.actualDate)
        toast({
          title: "Success",
          description: "Simulation settings updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update simulation settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving simulation settings:", error)
      toast({
        title: "Error",
        description: "Failed to update simulation settings",
        variant: "destructive",
      })
    } finally {
      setIsSavingSimulation(false)
    }
  }

  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/settings/upload-background", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setBackgroundImage(data.url)
        toast({
          title: "Success",
          description: "Background image updated successfully",
          variant: "success",
        })
      } else {
        throw new Error(data.message || "Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading background image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveBackgroundUrl = async () => {
    setIsUploading(true)

    try {
      const response = await fetch("/api/settings/update-background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: backgroundImage,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Background image URL updated successfully",
          variant: "success",
        })
      } else {
        throw new Error(data.message || "Failed to update background image URL")
      }
    } catch (error) {
      console.error("Error updating background image URL:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update background image URL",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: "API endpoint copied to clipboard",
          variant: "success",
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        })
      },
    )
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  const apiEndpoints = [
    {
      name: "Check-in",
      method: "POST",
      url: "/api/check-in",
      description: "Process a check-in using a QR code",
      requestBody: JSON.stringify(
        {
          qr_code: "hash_from_qr_code",
          event_id: 1,
        },
        null,
        2,
      ),
      response: JSON.stringify(
        {
          success: true,
          message: "Check-in successful",
          registration: {
            full_name: "John Doe",
            company: "Acme Inc",
            table_number: "A1",
          },
        },
        null,
        2,
      ),
    },
    {
      name: "Get Events",
      method: "GET",
      url: "/api/events",
      description: "Get all events",
      requestBody: "No request body needed",
      response: JSON.stringify(
        {
          success: true,
          events: [
            {
              id: 1,
              name: "Annual Conference 2023",
              description: "Our annual company conference",
              location: "Convention Center",
              start_date: "2023-12-15T09:00:00Z",
              end_date: "2023-12-16T17:00:00Z",
            },
          ],
        },
        null,
        2,
      ),
    },
    {
      name: "Check-in Statistics",
      method: "GET",
      url: "/api/check-in-stats?event_id=1",
      description: "Get check-in statistics for an event",
      requestBody: "No request body needed",
      response: JSON.stringify(
        {
          success: true,
          stats: {
            totalRegistrations: 100,
            checkedIn: 75,
            pendingCheckIn: 25,
            checkInRate: "75.0%",
          },
        },
        null,
        2,
      ),
    },
    {
      name: "Recent Check-ins",
      method: "GET",
      url: "/api/recent-check-ins?limit=10",
      description: "Get recent check-ins",
      requestBody: "No request body needed",
      response: JSON.stringify(
        {
          success: true,
          checkIns: [
            {
              id: 1,
              check_in_time: "2023-12-15T10:30:00Z",
              full_name: "John Doe",
              email: "john@example.com",
              company: "Acme Inc",
              table_number: "A1",
              event_name: "Annual Conference 2023",
              checked_in_by_name: null,
            },
          ],
        },
        null,
        2,
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <Tabs defaultValue="appearance">
          <TabsList className="mb-4">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="api">API Endpoints</TabsTrigger>
            <TabsTrigger value="simulation">Date Simulation</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Background Image</CardTitle>
                <CardDescription>
                  Set the background image for the check-in page. This image will be displayed behind the QR scanner.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="background-url">Background Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background-url"
                      value={backgroundImage}
                      onChange={(e) => setBackgroundImage(e.target.value)}
                      placeholder="Enter image URL or upload an image"
                    />
                    <Button onClick={handleSaveBackgroundUrl} disabled={isUploading}>
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-upload">Upload Image</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="background-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("background-upload")?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload Image
                    </Button>
                  </div>
                </div>

                {backgroundImage && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="border rounded-md overflow-hidden aspect-video relative">
                      <img
                        src={backgroundImage || "/placeholder.svg"}
                        alt="Background Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If image fails to load, show a placeholder
                          ;(e.target as HTMLImageElement).src = "/abstract-geometric-shapes.png"
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>
                  Use these API endpoints to integrate with your Laravel check-in application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <div className="flex items-center gap-2">
                      <Input value={baseUrl} readOnly />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(baseUrl)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Add this base URL before each endpoint path.</p>
                  </div>

                  <div className="space-y-4">
                    {apiEndpoints.map((endpoint, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                                {endpoint.method}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(`${baseUrl}${endpoint.url}`)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <CardDescription>{endpoint.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm">Endpoint</Label>
                              <div className="mt-1 p-2 bg-muted rounded-md font-mono text-sm">{endpoint.url}</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm">Request Body</Label>
                                <pre className="mt-1 p-2 bg-muted rounded-md overflow-auto text-xs">
                                  {endpoint.requestBody}
                                </pre>
                              </div>
                              <div>
                                <Label className="text-sm">Response</Label>
                                <pre className="mt-1 p-2 bg-muted rounded-md overflow-auto text-xs">
                                  {endpoint.response}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulation">
            <Card>
              <CardHeader>
                <CardTitle>Date Simulation</CardTitle>
                <CardDescription>
                  Simulate different dates to test multi-day check-in functionality without waiting for the actual next
                  day.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSimulation ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {simulationEnabled && (
                      <Alert variant="warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Date simulation is currently active. The system is using {currentDate} instead of the actual
                          date ({actualDate}).
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="simulation-toggle">Enable Date Simulation</Label>
                        <p className="text-sm text-muted-foreground">
                          When enabled, the system will use a simulated date for check-ins
                        </p>
                      </div>
                      <Switch
                        id="simulation-toggle"
                        checked={simulationEnabled}
                        onCheckedChange={setSimulationEnabled}
                      />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="date-offset">Date Offset (Days)</Label>
                          <span className="text-sm font-medium">{dateOffset} days</span>
                        </div>
                        <Slider
                          id="date-offset"
                          min={-30}
                          max={30}
                          step={1}
                          value={[dateOffset]}
                          onValueChange={(value) => setDateOffset(value[0])}
                          disabled={!simulationEnabled}
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">-30 days</span>
                          <span className="text-xs text-muted-foreground">+30 days</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label>Actual Date</Label>
                          <div className="flex items-center mt-1 p-2 bg-muted rounded-md">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{actualDate}</span>
                          </div>
                        </div>

                        <div>
                          <Label>Simulated Date</Label>
                          <div className="flex items-center mt-1 p-2 bg-primary/10 rounded-md">
                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                            <span className={simulationEnabled ? "font-medium" : "text-muted-foreground"}>
                              {currentDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button onClick={saveSimulationSettings} disabled={isSavingSimulation} className="w-full mt-4">
                        {isSavingSimulation ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Simulation Settings"
                        )}
                      </Button>

                      <div className="mt-6 p-4 border rounded-md bg-muted/50">
                        <h3 className="text-sm font-medium mb-2">How to test multi-day check-ins:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                          <li>Enable date simulation and set the offset to 0 (today)</li>
                          <li>Scan a QR code to check in an attendee</li>
                          <li>Try scanning the same QR code again - it should show "already checked in today"</li>
                          <li>Change the date offset to 1 (tomorrow) and save</li>
                          <li>Scan the same QR code - it should allow check-in for the new day</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure general settings for the check-in system.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">More settings will be added in future updates.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>Manage system data and perform maintenance operations.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Data Management</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use these tools to manage system data. Warning: Some operations cannot be undone.
                    </p>
                    <Button variant="destructive" onClick={() => setIsPurgeDialogOpen(true)}>
                      Purge System Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <PurgeSystemDialog isOpen={isPurgeDialogOpen} onClose={() => setIsPurgeDialogOpen(false)} />
    </AdminLayout>
  )
}
