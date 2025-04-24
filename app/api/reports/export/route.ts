import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import * as XLSX from "xlsx"
import PDFDocument from "pdfkit"

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

    // Generate report based on format
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
    } else if (format === "pdf") {
      // Create a PDF document
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      // Collect PDF data chunks
      doc.on("data", (chunk) => chunks.push(chunk))

      // Add title
      doc.fontSize(20).text("Check-in Report", { align: "center" })
      doc.moveDown()

      // Add filters information
      doc.fontSize(12)
      if (eventId) {
        const eventName = result.length > 0 ? result[0].event_name : "Selected Event"
        doc.text(`Event: ${eventName}`)
      }
      if (dateFrom) doc.text(`From: ${dateFrom}`)
      if (dateTo) doc.text(`To: ${dateTo}`)
      if (eventId || dateFrom || dateTo) doc.moveDown()

      // Add report generation timestamp
      doc.fontSize(10).text(`Report generated: ${new Date().toLocaleString()}`)
      doc.moveDown(2)

      // Define table layout
      const tableTop = doc.y
      const tableHeaders = ["Name", "Email", "Company", "Event", "Check-in Date/Time"]
      const columnWidths = [120, 150, 100, 100, 120]
      const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0)

      // Draw table headers
      let currentX = 50
      doc.font("Helvetica-Bold")
      tableHeaders.forEach((header, i) => {
        doc.text(header, currentX, tableTop, { width: columnWidths[i], align: "left" })
        currentX += columnWidths[i]
      })
      doc.moveDown()

      // Draw horizontal line
      doc
        .moveTo(50, doc.y)
        .lineTo(50 + tableWidth, doc.y)
        .stroke()
      doc.moveDown(0.5)

      // Draw table rows
      doc.font("Helvetica")
      reportData.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage()
          doc.y = 50
        }

        currentX = 50
        const rowData = [row.Name, row.Email, row.Company, row.Event, `${row["Check-in Date"]} ${row["Check-in Time"]}`]

        // Get the maximum height needed for this row
        let maxHeight = 0
        rowData.forEach((cell, i) => {
          const cellHeight = doc.heightOfString(cell, { width: columnWidths[i] })
          if (cellHeight > maxHeight) maxHeight = cellHeight
        })

        const rowY = doc.y

        // Draw each cell in the row
        rowData.forEach((cell, i) => {
          doc.text(cell, currentX, rowY, { width: columnWidths[i], align: "left" })
          currentX += columnWidths[i]
        })

        // Move down by the maximum height
        doc.y = rowY + maxHeight + 5

        // Draw a light gray line after each row (except the last)
        if (rowIndex < reportData.length - 1) {
          doc.strokeColor("#dddddd")
          doc
            .moveTo(50, doc.y - 2)
            .lineTo(50 + tableWidth, doc.y - 2)
            .stroke()
          doc.strokeColor("black")
        }
      })

      // Add page numbers
      const totalPages = doc.bufferedPageRange().count
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i)
        doc.fontSize(8).text(`Page ${i + 1} of ${totalPages}`, 50, doc.page.height - 50, { align: "center" })
      }

      // Finalize the PDF
      doc.end()

      // Return the PDF when it's ready
      return new Promise<NextResponse>((resolve) => {
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks)
          resolve(
            new NextResponse(pdfBuffer, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": "attachment; filename=check-in-report.pdf",
              },
            }),
          )
        })
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
