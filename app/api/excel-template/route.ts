import { NextResponse } from "next/server"
import { generateExcelTemplate } from "@/lib/excel-utils"

export async function GET() {
  try {
    const templateBuffer = generateExcelTemplate()

    // Convert ArrayBuffer to Buffer for the response
    const buffer = Buffer.from(templateBuffer)

    // Set the appropriate headers for file download
    const headers = {
      "Content-Disposition": "attachment; filename=registration-template.xlsx",
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }

    return new NextResponse(buffer, { headers })
  } catch (error) {
    console.error("Error generating Excel template:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate Excel template",
      },
      { status: 500 },
    )
  }
}
