"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { EventSelector } from "@/components/event-selector"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PurgeSystemDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function PurgeSystemDialog({ isOpen, onClose }: PurgeSystemDialogProps) {
  const [purgeType, setPurgeType] = useState("event")
  const [eventId, setEventId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const { toast } = useToast()

  const handlePurge = async () => {
    // Require confirmation text for full purge
    if (purgeType === "full" && confirmText !== "PURGE ALL") {
      toast({
        title: "Confirmation Required",
        description: 'Please type "PURGE ALL" to confirm full system purge',
        variant: "destructive",
      })
      return
    }

    // Require event selection for event purge
    if (purgeType === "event" && !eventId) {
      toast({
        title: "Event Required",
        description: "Please select an event to purge",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/purge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: purgeType,
          eventId: purgeType === "event" ? eventId : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Purge completed successfully",
        })
        onClose()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to purge system",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during the purge operation",
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
          <DialogTitle>Purge System Data</DialogTitle>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Warning: This action will permanently delete data and cannot be undone.</AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <RadioGroup value={purgeType} onValueChange={setPurgeType}>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="event" id="event" />
              <div className="grid gap-1.5">
                <Label htmlFor="event">Purge Event</Label>
                <p className="text-sm text-muted-foreground">
                  Delete all data related to a specific event, including registrations and check-ins.
                </p>
                {purgeType === "event" && <EventSelector value={eventId} onChange={setEventId} className="mt-2" />}
              </div>
            </div>

            <div className="flex items-start space-x-2 mt-4">
              <RadioGroupItem value="registrations" id="registrations" />
              <div className="grid gap-1.5">
                <Label htmlFor="registrations">Purge Registrations Only</Label>
                <p className="text-sm text-muted-foreground">
                  Delete all registrations and check-in logs, but keep events and other data.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 mt-4">
              <RadioGroupItem value="neon" id="neon" />
              <div className="grid gap-1.5">
                <Label htmlFor="neon">Purge Database Only</Label>
                <p className="text-sm text-muted-foreground">
                  Delete all data from the database, but keep uploaded files and images.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 mt-4">
              <RadioGroupItem value="blob" id="blob" />
              <div className="grid gap-1.5">
                <Label htmlFor="blob">Purge Uploads Only</Label>
                <p className="text-sm text-muted-foreground">
                  Delete all uploaded files and images, but keep database records.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 mt-4">
              <RadioGroupItem value="full" id="full" />
              <div className="grid gap-1.5">
                <Label htmlFor="full">Full System Purge</Label>
                <p className="text-sm text-muted-foreground">
                  Delete all data, including registrations, events, check-ins, and uploaded files.
                </p>
                {purgeType === "full" && (
                  <div className="mt-2">
                    <Label htmlFor="confirm-text">Type "PURGE ALL" to confirm</Label>
                    <input
                      id="confirm-text"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handlePurge} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Purging...
              </>
            ) : (
              "Purge Data"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
