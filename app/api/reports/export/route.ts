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
    const reportType = searchParams.get("type") || "registrations" // Default to registrations report

    console.log("Generating report:", { format, eventId, dateFrom, dateTo, reportType })

    let result = []

    // Choose query based on report type
    if (reportType === "checkins") {
      // Check-in report
      let query = `
        SELECT 
          cl.id as check_in_id, 
          cl.check_in_time, 
          r.id as registration_id,
          r.full_name, 
          r.email, 
          r.company,
          r.table_number,
          e.name as event_name,
          u.name as checked_in_by_name,
          cl.method as check_in_method
        FROM check_in_logs cl
        JOIN registrations r ON cl.registration_id = r.id
        JOIN events e ON cl.event_id = e.id
        LEFT JOIN users u ON cl.checked_in_by = u.id
      `

      const whereConditions = []
      const queryParams = []
      let paramIndex = 1

      if (eventId) {
        whereConditions.push(`e.id = $${paramIndex}`)
        queryParams.push(eventId)
        paramIndex++
      }

      if (dateFrom) {
        whereConditions.push(`DATE(cl.check_in_time) >= $${paramIndex}`)
        queryParams.push(dateFrom)
        paramIndex++
      }

      if (dateTo) {
        whereConditions.push(`DATE(cl.check_in_time) <= $${paramIndex}`)
        queryParams.push(dateTo)
        paramIndex++
      }

      if (whereConditions.length > 0) {
        query += " WHERE " + whereConditions.join(" AND ")
      }

      query += " ORDER BY cl.check_in_time DESC"

      result = await sql.unsafe(query, queryParams)
    } else {
      // Registrations report (default)
      let query = `
        SELECT 
          r.id,
          r.full_name,
          r.email,
          r.phone,
          r.company,
          r.roles,
          r.table_number,
          r.subsidiary,
          r.vendor_details,
          r.checked_in,
          r.check_in_time,
          r.created_at,
          e.name as event_name
        FROM 
          registrations r
        LEFT JOIN 
          event_registrations er ON r.id = er.registration_id
        LEFT JOIN 
          events e ON er.event_id = e.id
      `

      const whereConditions = []
      const queryParams = []
      let paramIndex = 1

      if (eventId) {
        whereConditions.push(`e.id = $${paramIndex}`)
        queryParams.push(eventId)
        paramIndex++
      }

      if (dateFrom) {
        whereConditions.push(`DATE(r.created_at) >= $${paramIndex}`)
        queryParams.push(dateFrom)
        paramIndex++
      }

      if (dateTo) {
        whereConditions.push(`DATE(r.created_at) <= $${paramIndex}`)
        queryParams.push(dateTo)
        paramIndex++
      }

      if (whereConditions.length > 0) {
        query += " WHERE " + whereConditions.join(" AND ")
      }

      query += " ORDER BY r.full_name"

      result = await sql.unsafe(query, queryParams)
    }

    console.log(`Query returned ${result ? result.length : 0} rows`)

    // Ensure result is an array
    if (!result || !Array.isArray(result)) {
      console.error("Query result is not an array:", result)
      result = []
    }

    // Format the data based on the requested format
    if (format === "excel") {
      // Create a workbook
      const wb = XLSX.utils.book_new()

      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(result)

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, reportType === "checkins" ? "Check-ins" : "Registrations")

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

      // Return the Excel file
      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=${reportType}-report.xlsx`,
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
