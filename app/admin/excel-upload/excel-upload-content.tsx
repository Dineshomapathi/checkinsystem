"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, FileSpreadsheet } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function ExcelUploadContent() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [eventId, setEventId] = useState<string>("")
  const [events, setEvents] = useState<any[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true)
      const response = await fetch("/api/events")
      const data = await response.json()

      if (data.success) {
        setEvents(data.events)
        if (data.events.length > 0) {
          setEventId(data.events[0].id.toString())
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load events",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching events",
        variant: "destructive",
      })
    } finally {
      setIsLoadingEvents(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError(null)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    if (!eventId) {
      setError("Please select an event")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    setUploadResult(null)

    // Create form data
    const formData = new FormData()
    formData.append("file", file)
    formData.append("event_id", eventId)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch("/api/upload-registrations", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (data.success) {
        setUploadResult(data)
        toast({
          title: "Upload Successful",
          description: data.message,
        })
      } else {
        setError(data.message || "Failed to upload file")
        toast({
          title: "Upload Failed",
          description: data.message || "Failed to upload file",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred")
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    window.location.href = "/api/excel-template"
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Excel Upload</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sample Data</CardTitle>
            <CardDescription>View sample Excel data to understand the expected format</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/api/test-excel-parse")} disabled={isUploading}>
              View Sample Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Registrations</CardTitle>
            <CardDescription>
              Upload an Excel file with registration data. The file should include columns for Company, Name, Email,
              Roles, Vendor details, Subsidiary, and Hash.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md text-sm">
                <h3 className="font-semibold mb-2">Required Excel Format:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Company</strong> - Optional
                  </li>
                  <li>
                    <strong>Name</strong> - Required
                  </li>
                  <li>
                    <strong>Email</strong> - Required
                  </li>
                  <li>
                    <strong>Roles</strong> - Optional
                  </li>
                  <li>
                    <strong>Vendor details</strong> - Optional
                  </li>
                  <li>
                    <strong>Subsidiary</strong> - Optional (can be spelled "Subsidary")
                  </li>
                  <li>
                    <strong>Hash</strong> - Required (unique identifier for QR code)
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-id">Select Event</Label>
                {isLoadingEvents ? (
                  <div className="text-sm text-muted-foreground">Loading events...</div>
                ) : events.length > 0 ? (
                  <Select value={eventId} onValueChange={setEventId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground">No events found. Please create an event first.</div>
                )}
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  {file ? file.name : "Drag and drop your Excel file here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Accepted file types: .xlsx, .xls, .csv (Max size: 5MB)
                </p>
                <input
                  type="file"
                  id="excel-file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("excel-file")?.click()}
                  className="mx-auto"
                >
                  Select File
                </Button>
              </div>

              {file && (
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                    Remove
                  </Button>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button onClick={downloadTemplate} variant="outline">
                  Download Template
                </Button>
                <Button onClick={handleUpload} disabled={!file || isUploading || !eventId || events.length === 0}>
                  {isUploading ? "Uploading..." : "Upload File"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Results</CardTitle>
          <CardDescription>View the results of your Excel file upload</CardDescription>
        </CardHeader>
        <CardContent>
          {uploadResult ? (
            <div className="space-y-4">
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Upload Successful</AlertTitle>
                <AlertDescription className="text-green-700">{uploadResult.message}</AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                  <p className="text-2xl font-bold">{uploadResult.results.total}</p>
                </div>
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">Successfully Processed</p>
                  <p className="text-2xl font-bold text-green-600">{uploadResult.results.successful}</p>
                </div>
              </div>

              {uploadResult.results.failed > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Errors ({uploadResult.results.failed})</h3>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-[200px] overflow-y-auto">
                    <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                      {uploadResult.results.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>

                  {uploadResult.results.failedRecords && uploadResult.results.failedRecords.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Failed Records</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Name
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Email
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Reason
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {uploadResult.results.failedRecords.map((item, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 text-xs">{item.record.name || "-"}</td>
                                <td className="px-3 py-2 text-xs">{item.record.email || "-"}</td>
                                <td className="px-3 py-2 text-xs text-red-600">{item.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Upload a file to see results</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
