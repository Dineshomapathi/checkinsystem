import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import * as XLSX from "xlsx"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "excel"
    const eventId = searchParams.get("event_id")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")

    // Build the query based on filters
    let query = `
      SELECT 
        r.id,
        r.full_name,
        r.email,
        r.company,
        r.roles,
        r.table_number,
        r.subsidiary,
        r.vendor_details,
        r.checked_in,
        r.check_in_time,
        e.name as event_name,
        cl.check_in_time as last_check_in,
        cl.method as check_in_method,
        u.name as checked_in_by
      FROM 
        registrations r
      LEFT JOIN 
        event_registrations er ON r.id = er.registration_id
      LEFT JOIN 
        events e ON er.event_id = e.id
      LEFT JOIN 
        check_in_logs cl ON r.id = cl.registration_id
      LEFT JOIN 
        users u ON cl.checked_in_by = u.id
    `

    const whereConditions = []
    const queryParams = []

    if (eventId) {
      whereConditions.push("e.id = $1")
      queryParams.push(eventId)
    }

    if (dateFrom) {
      whereConditions.push(`DATE(cl.check_in_time) >= $${queryParams.length + 1}`)
      queryParams.push(dateFrom)
    }

    if (dateTo) {
      whereConditions.push(`DATE(cl.check_in_time) <= $${queryParams.length + 1}`)
      queryParams.push(dateTo)
    }

    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ")
    }

    query += " ORDER BY r.full_name"

    // Execute the query
    const result = await sql.unsafe(query, queryParams)

    // Format the data based on the requested format
    if (format === "excel") {
      // Create a workbook
      const wb = XLSX.utils.book_new()

      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(result)

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Registrations")

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

      // Return the Excel file
      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=registrations-report.xlsx",
        },
      })
    } else if (format === "pdf") {
      // For PDF, we'll return JSON for now
      // In a real implementation, you would use a PDF generation library
      return NextResponse.json({
        success: false,
        message: "PDF export is not implemented yet",
      })
    } else {
      // Default to JSON
      return NextResponse.json({
        success: true,
        data: result,
      })
    }
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error generating report",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
