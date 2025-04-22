"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EventSelector } from "@/components/event-selector"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileSpreadsheet, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const [eventId, setEventId] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generateReport = async (format: "excel" | "pdf") => {
    setIsGenerating(true)

    try {
      // Build the URL with query parameters
      let url = `/api/reports/export?format=${format}`

      if (eventId) {
        url += `&event_id=${eventId}`
      }

      if (dateFrom) {
        url += `&date_from=${dateFrom}`
      }

      if (dateTo) {
        url += `&date_to=${dateTo}`
      }

      // For Excel, trigger a download
      if (format === "excel") {
        window.location.href = url
        toast({
          title: "Success",
          description: "Excel report is being downloaded",
        })
      } else {
        // For PDF, we'll show a message for now
        toast({
          title: "Information",
          description: "PDF export is not implemented yet",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>

        <Card>
          <CardHeader>
            <CardTitle>Generate Reports</CardTitle>
            <CardDescription>
              Generate reports of registrations and check-ins. Filter by event and date range.
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

              <div className="flex flex-col md:flex-row gap-4 mt-6">
                <Button onClick={() => generateReport("excel")} disabled={isGenerating} className="flex-1">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generating..." : "Export to Excel"}
                </Button>

                <Button
                  onClick={() => generateReport("pdf")}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export to PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Types</CardTitle>
            <CardDescription>Different types of reports available in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Registration Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  List of all registrations with their details and check-in status.
                </p>
                <Button variant="outline" className="w-full" onClick={() => generateReport("excel")}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Check-in Report</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed report of all check-ins with timestamps and check-in method.
                </p>
                <Button variant="outline" className="w-full" onClick={() => generateReport("excel")}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
