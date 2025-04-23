import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "excel"
    const eventId = searchParams.get("event_id")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")

    console.log("Generating simple check-in report:", { format, eventId, dateFrom, dateTo })

    // Simple query to get all registrations with check-in status and time
    let queryText = `
      SELECT 
        r.id,
        r.full_name,
        r.email,
        r.company,
        r.table_number,
        r.checked_in,
        COALESCE(cl.check_in_time, r.check_in_time) as check_in_time,
        e.name as event_name
      FROM 
        registrations r
      LEFT JOIN 
        event_registrations er ON r.id = er.registration_id
      LEFT JOIN 
        events e ON er.event_id = e.id
      LEFT JOIN (
        SELECT registration_id, MAX(check_in_time) as check_in_time
        FROM check_in_logs
        GROUP BY registration_id
      ) cl ON r.id = cl.registration_id
    `

    // Add WHERE clauses if needed
    const conditions = []
    if (eventId) {
      conditions.push(`e.id = ${eventId}`)
    }
    if (dateFrom) {
      conditions.push(
        `(DATE(COALESCE(cl.check_in_time, r.check_in_time)) >= '${dateFrom}' OR (r.checked_in = false AND r.created_at >= '${dateFrom}'))`,
      )
    }
    if (dateTo) {
      conditions.push(
        `(DATE(COALESCE(cl.check_in_time, r.check_in_time)) <= '${dateTo}' OR (r.checked_in = false AND r.created_at <= '${dateTo}'))`,
      )
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`
    }

    queryText += " ORDER BY r.full_name"

    console.log("Executing query:", queryText)
    const result = await sql.unsafe(queryText)
    console.log(`Query returned ${result.length} rows`)

    // Format the data for the report
    const reportData = result.map((row) => ({
      Name: row.full_name,
      Email: row.email,
      Company: row.company || "",
      Table: row.table_number || "",
      Event: row.event_name || "",
      Status: row.checked_in ? "Checked In" : "Not Checked In",
      "Check-in Time": row.check_in_time ? new Date(row.check_in_time).toLocaleString() : "",
    }))

    // Format the data based on the requested format
    if (format === "excel") {
      // Create a workbook
      const wb = XLSX.utils.book_new()

      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(reportData)

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Check-ins")

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { type: 'buffer", bookType": "xlsx' })

      // Return the Excel file
      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=check-in-report.xlsx`,
        },
      })
    } else if (format === "pdf") {
      // Create a new PDF document
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(16)
      doc.text("Check-in Report", 14, 15)

      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22)

      // Add filters if any
      let filterText = ""
      if (eventId) {
        const eventName = result.length > 0 ? result[0].event_name : "Selected Event"
        filterText += `Event: ${eventName}, `
      }
      if (dateFrom) filterText += `From: ${dateFrom}, `
      if (dateTo) filterText += `To: ${dateTo}, `

      if (filterText) {
        filterText = filterText.slice(0, -2) // Remove trailing comma and space
        doc.text(`Filters: ${filterText}`, 14, 28)
      }

      // Create table
      autoTable(doc, {
        startY: filterText ? 32 : 25,
        head: [["Name", "Email", "Company", "Table", "Status", "Check-in Time"]],
        body: reportData.map((row) => [row.Name, row.Email, row.Company, row.Table, row.Status, row["Check-in Time"]]),
        theme: "striped",
        headStyles: { fillColor: [66, 139, 202] },
      })

      // Generate PDF buffer
      const pdfBuffer = doc.output("arraybuffer")

      // Return the PDF file
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=check-in-report.pdf`,
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
