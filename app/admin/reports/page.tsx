"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EventSelector } from "@/components/event-selector"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReportsPage() {
  const [eventId, setEventId] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportFormat, setReportFormat] = useState("excel")
  const { toast } = useToast()

  const generateReport = async () => {
    setIsGenerating(true)

    try {
      // Build the URL with query parameters
      let url = `/api/reports/export?format=${reportFormat}`

      if (eventId) {
        url += `&event_id=${eventId}`
      }

      if (dateFrom) {
        url += `&date_from=${dateFrom}`
      }

      if (dateTo) {
        url += `&date_to=${dateTo}`
      }

      // Trigger download
      window.location.href = url

      toast({
        title: "Success",
        description: `${reportFormat.toUpperCase()} report is being downloaded`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => setIsGenerating(false), 1000)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Check-in Reports</h1>

        <Card>
          <CardHeader>
            <CardTitle>Generate Check-in Report</CardTitle>
            <CardDescription>
              Generate a simple report of all checked-in registrations with their check-in time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <EventSelector value={eventId} onChange={setEventId} label="Event (Optional)" />

                <div>
                  <Label htmlFor="date-from">From Date (Optional)</Label>
                  <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="date-to">To Date (Optional)</Label>
                  <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <Label>Report Format</Label>
                <Tabs defaultValue="excel" className="mt-2" onValueChange={setReportFormat}>
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="excel">Excel</TabsTrigger>
                    <TabsTrigger value="pdf">PDF</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-6">
                <Button onClick={generateReport} disabled={isGenerating} className="flex-1">
                  {reportFormat === "excel" ? (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  {isGenerating ? "Generating..." : `Export to ${reportFormat.toUpperCase()}`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Reports</CardTitle>
            <CardDescription>Generate pre-configured reports with a single click</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Today's Check-ins</h3>
                <p className="text-sm text-muted-foreground mb-4">List of all registrations checked in today.</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0]
                      window.location.href = `/api/reports/export?format=excel&date_from=${today}&date_to=${today}`
                    }}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0]
                      window.location.href = `/api/reports/export?format=pdf&date_from=${today}&date_to=${today}`
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">All Check-ins</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete list of all checked-in registrations with timestamps.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.location.href = `/api/reports/export?format=excel`
                    }}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.location.href = `/api/reports/export?format=pdf`
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
