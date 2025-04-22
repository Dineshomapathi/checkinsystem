"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface RegistrationFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  registration?: any
  isEdit?: boolean
}

export function RegistrationFormDialog({
  isOpen,
  onClose,
  onSuccess,
  registration,
  isEdit = false,
}: RegistrationFormDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    roles: "",
    table_number: "",
    subsidiary: "",
    vendor_details: "",
    qr_code: "",
  })

  useEffect(() => {
    if (registration && isEdit) {
      setFormData({
        full_name: registration.full_name || "",
        email: registration.email || "",
        phone: registration.phone || "",
        company: registration.company || "",
        roles: registration.roles || "",
        table_number: registration.table_number || "",
        subsidiary: registration.subsidiary || "",
        vendor_details: registration.vendor_details || "",
        qr_code: registration.qr_code || "",
      })
    } else {
      // Reset form for new registration
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        company: "",
        roles: "",
        table_number: "",
        subsidiary: "",
        vendor_details: "",
        qr_code: "",
      })
    }
  }, [registration, isEdit, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.full_name || !formData.email) {
        toast({
          title: "Error",
          description: "Name and email are required fields",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Generate QR code hash if not provided
      if (!formData.qr_code) {
        // Use email as the hash if not provided
        formData.qr_code = btoa(formData.email)
      }

      const url = isEdit ? `/api/registrations/${registration.id}` : "/api/registrations"
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
          description: isEdit ? "Registration updated successfully" : "Registration created successfully",
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save registration",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving registration:", error)
      toast({
        title: "Error",
        description: "An error occurred while saving the registration",
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
          <DialogTitle>{isEdit ? "Edit Registration" : "Add New Registration"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Name *
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roles" className="text-right">
                Roles
              </Label>
              <Input id="roles" name="roles" value={formData.roles} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table_number" className="text-right">
                Table Number
              </Label>
              <Input
                id="table_number"
                name="table_number"
                value={formData.table_number}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subsidiary" className="text-right">
                Subsidiary
              </Label>
              <Input
                id="subsidiary"
                name="subsidiary"
                value={formData.subsidiary}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vendor_details" className="text-right">
                Vendor Details
              </Label>
              <Input
                id="vendor_details"
                name="vendor_details"
                value={formData.vendor_details}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="qr_code" className="text-right">
                QR Code Hash
              </Label>
              <Input
                id="qr_code"
                name="qr_code"
                value={formData.qr_code}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Leave blank to auto-generate"
              />
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
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
