"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Copy, Download } from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function FetchNamesPage() {
  const [names, setNames] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
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

  const fetchNames = async () => {
    if (!eventId) {
      toast({
        title: "Error",
        description: "Please select an event",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setNames([])

    try {
      const response = await fetch(`/api/registrations/names?event_id=${eventId}`)
      const data = await response.json()

      if (data.success) {
        setNames(data.names)
        toast({
          title: "Success",
          description: `Retrieved ${data.names.length} names from the database`,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch names",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching names",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(names.join("\n"))
      .then(() => {
        toast({
          title: "Copied!",
          description: "Names copied to clipboard",
        })
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy names to clipboard",
          variant: "destructive",
        })
      })
  }

  const downloadNames = () => {
    const blob = new Blob([names.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "database-names.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Fetch Database Names</h1>
        <p className="text-muted-foreground">Retrieve all names from the database to compare with your Excel file.</p>

        <Card>
          <CardHeader>
            <CardTitle>Fetch Names</CardTitle>
            <CardDescription>Select an event and click the button to fetch all names from the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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

              <Button onClick={fetchNames} disabled={isLoading || !eventId || events.length === 0} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching Names...
                  </>
                ) : (
                  "Fetch Names from Database"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {names.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Database Names</CardTitle>
              <CardDescription>Found {names.length} names in the database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea value={names.join("\n")} readOnly className="min-h-[300px] font-mono text-sm" />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" onClick={downloadNames}>
                    <Download className="mr-2 h-4 w-4" />
                    Download as Text
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
