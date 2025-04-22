import { NextResponse } from "next/server"
import { parseExcelFile, processRegistrationsUpload } from "@/lib/excel-utils"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const eventId = formData.get("event_id") ? Number(formData.get("event_id")) : 1

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    // Read the file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer()

    // Parse the Excel file
    const registrations = await parseExcelFile(fileBuffer)

    if (registrations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid registrations found in the file. Make sure the file has the required columns: Name, Email, and Hash.",
        },
        { status: 400 },
      )
    }

    console.log(`Processing ${registrations.length} registrations...`)

    // Process the registrations
    const results = await processRegistrationsUpload(registrations, eventId)

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${results.successful} out of ${results.total} registrations`,
      results,
    })
  } catch (error) {
    console.error("Error uploading registrations:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process registration data",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
