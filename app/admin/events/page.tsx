"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Calendar } from "lucide-react"
import { EventFormDialog } from "@/components/event-form-dialog"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/events")
      const data = await response.json()

      if (data.success) {
        setEvents(data.events)
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
      setIsLoading(false)
    }
  }

  const handleAddEvent = () => {
    setSelectedEvent(null)
    setIsEdit(false)
    setIsFormOpen(true)
  }

  const handleEditEvent = (event) => {
    setSelectedEvent(event)
    setIsEdit(true)
    setIsFormOpen(true)
  }

  const handleDeleteEvent = (event) => {
    setEventToDelete(event)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!eventToDelete) return

    try {
      const response = await fetch(`/api/events/${eventToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        })
        fetchEvents()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the event",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <Button onClick={handleAddEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Management</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading events...</div>
            ) : events.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>{formatDate(event.start_date)}</TableCell>
                      <TableCell>{formatDate(event.end_date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditEvent(event)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(event)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                <p>No events found</p>
                <Button onClick={handleAddEvent} variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first event
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Form Dialog */}
      <EventFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchEvents}
        event={selectedEvent}
        isEdit={isEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Event"
        description={`Are you sure you want to delete ${
          eventToDelete?.name || "this event"
        }? This action cannot be undone and will remove all registrations associated with this event.`}
      />
    </AdminLayout>
  )
}
