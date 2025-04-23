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

    console.log("Generating simplified check-in report:", { format, eventId, dateFrom, dateTo })

    // Simplified query to get only checked-in registrations with their check-in time
    let query = sql`
      SELECT 
        r.full_name,
        r.email,
        r.company,
        COALESCE(cl.check_in_time, r.check_in_time) as check_in_time
      FROM 
        registrations r
      LEFT JOIN (
        SELECT registration_id, MAX(check_in_time) as check_in_time
        FROM check_in_logs
        GROUP BY registration_id
      ) cl ON r.id = cl.registration_id
      WHERE COALESCE(cl.check_in_time, r.check_in_time) IS NOT NULL
    `

    // Add additional filters if provided
    if (eventId) {
      query = sql`
        ${query} 
        AND r.id IN (
          SELECT registration_id FROM event_registrations WHERE event_id = ${eventId}
        )
      `
    }

    if (dateFrom) {
      query = sql`
        ${query} 
        AND DATE(COALESCE(cl.check_in_time, r.check_in_time)) >= ${dateFrom}
      `
    }

    if (dateTo) {
      query = sql`
        ${query} 
        AND DATE(COALESCE(cl.check_in_time, r.check_in_time)) <= ${dateTo}
      `
    }

    query = sql`
      ${query} 
      ORDER BY COALESCE(cl.check_in_time, r.check_in_time) DESC
    `

    console.log("Executing simplified query")
    const result = await query
    console.log(`Query returned ${result.length} rows`)

    // Format the data for the report - only include essential fields
    const reportData = result.map((row) => ({
      Name: row.full_name || "",
      Email: row.email || "",
      Company: row.company || "",
      "Check-in Time": row.check_in_time ? new Date(row.check_in_time).toLocaleString() : "",
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
