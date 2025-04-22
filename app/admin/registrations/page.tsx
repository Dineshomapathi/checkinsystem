"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    fetchRegistrations()
  }, [currentPage])

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/registrations?page=${currentPage}&limit=10`)
      const data = await response.json()

      if (data.success) {
        setRegistrations(data.registrations)
        setTotalPages(data.totalPages)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load registrations",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching registrations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchRegistrations()
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/search-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      const data = await response.json()

      if (data.success) {
        setRegistrations(data.registrations)
        setTotalPages(1) // Search results are on a single page
      } else {
        toast({
          title: "No Results",
          description: data.message || "No registrations found matching your search",
        })
        setRegistrations([])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while searching",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateQR = async (registrationId) => {
    try {
      const response = await fetch(`/api/generate-qr/${registrationId}`)
      const data = await response.json()

      if (data.success) {
        // Open QR code in a new window
        const newWindow = window.open("", "_blank")
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>QR Code</title>
                <style>
                  body { 
                    font-family: Arial, sans-serif; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                  }
                  .qr-container {
                    text-align: center;
                    max-width: 400px;
                  }
                  img {
                    max-width: 100%;
                    height: auto;
                  }
                  h2 {
                    margin-bottom: 5px;
                  }
                  p {
                    margin: 5px 0;
                  }
                  .print-button {
                    margin-top: 20px;
                    padding: 10px 20px;
                    background-color: #0070f3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                  }
                </style>
              </head>
              <body>
                <div class="qr-container">
                  <h2>${data.registration.full_name}</h2>
                  ${data.registration.company ? `<p>Company: ${data.registration.company}</p>` : ""}
                  ${data.registration.table_number ? `<p>Table: ${data.registration.table_number}</p>` : ""}
                  <img src="${data.qrCodeDataUrl}" alt="QR Code" />
                  <p>Scan this QR code to check in</p>
                  <button class="print-button" onclick="window.print()">Print QR Code</button>
                </div>
              </body>
            </html>
          `)
          newWindow.document.close()
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to generate QR code",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while generating the QR code",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Registrations</h1>

        <Card>
          <CardHeader>
            <CardTitle>Search Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                placeholder="Search by name, email, or company"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    fetchRegistrations()
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading registrations...</div>
            ) : registrations.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell className="font-medium">{registration.full_name}</TableCell>
                          <TableCell>{registration.email}</TableCell>
                          <TableCell>{registration.company || "-"}</TableCell>
                          <TableCell>{registration.roles || "-"}</TableCell>
                          <TableCell>
                            {registration.checked_in ? (
                              <span className="text-green-600">Checked In</span>
                            ) : (
                              <span className="text-amber-600">Not Checked In</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleGenerateQR(registration.id)}>
                                QR Code
                              </Button>
                              {!registration.checked_in && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // Handle manual check-in
                                  }}
                                >
                                  Check In
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {!searchQuery && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink isActive={page === currentPage} onClick={() => setCurrentPage(page)}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No registrations found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
