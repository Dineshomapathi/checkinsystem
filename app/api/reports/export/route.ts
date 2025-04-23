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

    console.log("Generating check-in report:", { format, eventId, dateFrom, dateTo })

    // Query to get check-ins from the check_in_logs table
    let query = sql`
      SELECT 
        r.full_name,
        r.email,
        r.company,
        cl.check_in_time,
        e.name as event_name,
        DATE(cl.check_in_time) as check_in_date
      FROM 
        check_in_logs cl
      JOIN 
        registrations r ON cl.registration_id = r.id
      JOIN 
        events e ON cl.event_id = e.id
      WHERE 1=1
    `

    // Add additional filters if provided
    if (eventId) {
      query = sql`
        ${query} 
        AND cl.event_id = ${eventId}
      `
    }

    if (dateFrom) {
      query = sql`
        ${query} 
        AND DATE(cl.check_in_time) >= ${dateFrom}
      `
    }

    if (dateTo) {
      query = sql`
        ${query} 
        AND DATE(cl.check_in_time) <= ${dateTo}
      `
    }

    query = sql`
      ${query} 
      ORDER BY cl.check_in_time DESC
    `

    console.log("Executing query")
    const result = await query
    console.log(`Query returned ${result.length} rows`)

    // Format the data for the report
    const reportData = result.map((row) => ({
      Name: row.full_name || "",
      Email: row.email || "",
      Company: row.company || "",
      Event: row.event_name || "",
      "Check-in Date": row.check_in_date ? new Date(row.check_in_date).toLocaleDateString() : "",
      "Check-in Time": row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString() : "",
      "Full Timestamp": row.check_in_time ? new Date(row.check_in_time).toLocaleString() : "",
    }))

    // Generate Excel file
    if (format === "excel") {
      // Create a workbook
      const wb = XLSX.utils.book_new()

      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(reportData)

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Check-ins")

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

      // Return the Excel file
      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=check-in-report.xlsx`,
        },
      })
    } else {
      // Default to JSON
      return NextResponse.json({
        success: true,
        data: reportData,
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
