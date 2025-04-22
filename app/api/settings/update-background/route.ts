import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ success: false, message: "No URL provided" }, { status: 400 })
    }

    // Update the background image setting in the database
    await sql`
      UPDATE settings
      SET value = ${url}, updated_at = NOW()
      WHERE key = 'background_image'
    `

    return NextResponse.json({
      success: true,
      message: "Background image URL updated successfully",
    })
  } catch (error) {
    console.error("Error updating background image URL:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error updating background image URL",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
