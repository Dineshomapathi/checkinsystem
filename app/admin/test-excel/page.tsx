"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { FileUpload } from "@/components/file-upload"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function TestExcelPage() {
  const [testData, setTestData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchTestData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/test-excel-parse")
      const data = await response.json()

      if (data.success) {
        setTestData(data.data)
        toast({
          title: "Success",
          description: `Parsed ${data.rowCount} rows of sample data`,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to parse sample data",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching test data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadSuccess = (data) => {
    toast({
      title: "Upload Successful",
      description: data.message,
    })
  }

  const downloadTemplate = () => {
    window.location.href = "/api/excel-template"
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Test Excel Upload</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sample Data</CardTitle>
              <CardDescription>View sample Excel data to understand the expected format</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchTestData} disabled={isLoading}>
                {isLoading ? "Loading..." : "Load Sample Data"}
              </Button>

              {testData.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.company || "-"}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.roles || "-"}</TableCell>
                          <TableCell className="font-mono text-xs truncate max-w-[150px]">{row.hash}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
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
                      <strong>Subsidiary</strong> - Optional
                    </li>
                    <li>
                      <strong>Hash</strong> - Required (Base64 encoded email or unique identifier)
                    </li>
                  </ul>
                </div>

                <FileUpload
                  acceptedFileTypes=".xlsx,.xls,.csv"
                  maxSize={5}
                  endpoint="/api/upload-registrations"
                  onSuccess={handleUploadSuccess}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Excel Template</CardTitle>
            <CardDescription>Download a template Excel file to use as a starting point</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You can download this template and fill it with your data. Make sure to keep the column headers exactly as
              shown.
            </p>
            <Button onClick={downloadTemplate}>Download Template</Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
