"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface EventFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  event?: any
  isEdit?: boolean
}

export function EventFormDialog({ isOpen, onClose, onSuccess, event, isEdit = false }: EventFormDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
  })

  useEffect(() => {
    if (event && isEdit) {
      // Format dates for input fields (YYYY-MM-DD)
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString)
        return date.toISOString().split("T")[0]
      }

      setFormData({
        name: event.name || "",
        description: event.description || "",
        location: event.location || "",
        start_date: formatDateForInput(event.start_date) || "",
        end_date: formatDateForInput(event.end_date) || "",
      })
    } else {
      // Set default dates for new events (today and tomorrow)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const formatDateForInput = (date: Date) => {
        return date.toISOString().split("T")[0]
      }

      setFormData({
        name: "",
        description: "",
        location: "",
        start_date: formatDateForInput(today),
        end_date: formatDateForInput(tomorrow),
      })
    }
  }, [event, isEdit, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.start_date || !formData.end_date) {
        toast({
          title: "Error",
          description: "Name, start date, and end date are required fields",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Validate dates
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)

      if (endDate < startDate) {
        toast({
          title: "Error",
          description: "End date cannot be before start date",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const url = isEdit ? `/api/events/${event.id}` : "/api/events"
      const method = isEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: isEdit ? "Event updated successfully" : "Event created successfully",
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save event",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving event:", error)
      toast({
        title: "Error",
        description: "An error occurred while saving the event",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update Event"
              ) : (
                "Create Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
