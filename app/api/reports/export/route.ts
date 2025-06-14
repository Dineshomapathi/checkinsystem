import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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

    // Get summary statistics
    let statsQuery = sql`
      SELECT 
        COUNT(*) as total_registrations,
        SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as checked_in_count,
        SUM(CASE WHEN checked_in = false OR checked_in IS NULL THEN 1 ELSE 0 END) as not_checked_in_count
      FROM 
        registrations
      WHERE 1=1
    `

    // Add event filter if provided
    if (eventId) {
      statsQuery = sql`
        ${statsQuery}
        AND id IN (
          SELECT registration_id 
          FROM event_registrations 
          WHERE event_id = ${eventId}
        )
      `
    }

    // Execute the stats query
    const statsResult = await statsQuery
    const stats = statsResult[0]

    // Format the data for the report with Malaysia timezone (GMT+8)
    const reportData = result.map((row) => {
      // Convert UTC timestamp to Malaysia time (GMT+8)
      const checkInTime = row.check_in_time ? new Date(row.check_in_time) : null

      // Add 8 hours to convert from UTC to Malaysia time
      if (checkInTime) {
        checkInTime.setHours(checkInTime.getHours() + 8)
      }

      return {
        Name: row.full_name || "",
        Email: row.email || "",
        Company: row.company || "",
        Event: row.event_name || "",
        "Check-in Date": checkInTime ? checkInTime.toLocaleDateString("en-MY") : "",
        "Check-in Time": checkInTime
          ? checkInTime.toLocaleTimeString("en-MY", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })
          : "",
        "Full Timestamp": checkInTime ? checkInTime.toLocaleString("en-MY") : "",
      }
    })

    // Generate report based on format
    if (format === "excel") {
      // Create a workbook
      const wb = XLSX.utils.book_new()

      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(reportData)

      // Add summary statistics at the end
      const lastRow = reportData.length + 2
      XLSX.utils.sheet_add_aoa(
        ws,
        [
          ["Summary Statistics:"],
          [`Total Registrations: ${stats.total_registrations}`],
          [`Checked-in: ${stats.checked_in_count}`],
          [`Not Checked-in: ${stats.not_checked_in_count}`],
        ],
        { origin: { r: lastRow, c: 0 } },
      )

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
      // Create a new PDF document (A4 size)
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(18)
      doc.text("Check-in Report", 105, 15, { align: "center" })

      // Add filters information
      doc.setFontSize(10)
      let yPos = 25

      if (eventId && result.length > 0) {
        doc.text(`Event: ${result[0].event_name}`, 14, yPos)
        yPos += 5
      }

      if (dateFrom) {
        doc.text(`From: ${dateFrom}`, 14, yPos)
        yPos += 5
      }

      if (dateTo) {
        doc.text(`To: ${dateTo}`, 14, yPos)
        yPos += 5
      }

      // Add report generation timestamp (in Malaysia time)
      const now = new Date()
      now.setHours(now.getHours() + 8) // Convert to Malaysia time
      doc.text(`Report generated: ${now.toLocaleString("en-MY")} (Malaysia Time)`, 14, yPos)
      yPos += 10

      // Prepare data for the table
      const tableHeaders = [["Name", "Email", "Company", "Event", "Check-in Date/Time"]]
      const tableData = reportData.map((row) => [
        row.Name,
        row.Email,
        row.Company,
        row.Event,
        `${row["Check-in Date"]} ${row["Check-in Time"]}`,
      ])

      // Add the table to the PDF
      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: yPos,
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        margin: { top: 15 },
        styles: {
          overflow: "linebreak",
          cellPadding: 3,
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Name
          1: { cellWidth: 50 }, // Email
          2: { cellWidth: 30 }, // Company
          3: { cellWidth: 30 }, // Event
          4: { cellWidth: 40 }, // Check-in Date/Time
        },
      })

      // Add summary statistics at the end
      const finalY = (doc as any).lastAutoTable.finalY || doc.internal.pageSize.height - 40
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Summary:", 14, finalY + 10)
      doc.setFont("helvetica", "normal")
      doc.text(`Total Registrations: ${stats.total_registrations}`, 14, finalY + 20)
      doc.text(`Checked-in: ${stats.checked_in_count}`, 14, finalY + 30)
      doc.text(`Not Checked-in: ${stats.not_checked_in_count}`, 14, finalY + 40)

      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: "center" })
      }

      // Generate PDF buffer
      const pdfBuffer = doc.output("arraybuffer")

      // Return the PDF
      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=check-in-report.pdf",
        },
      })
    } else {
      // Default to JSON
      return NextResponse.json({
        success: true,
        data: reportData,
        summary: {
          totalRegistrations: stats.total_registrations,
          checkedIn: stats.checked_in_count,
          notCheckedIn: stats.not_checked_in_count,
        },
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
