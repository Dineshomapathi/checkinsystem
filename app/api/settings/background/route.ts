import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Get the background image setting from the database
    const result = await sql`
      SELECT value FROM settings
      WHERE key = 'background_image'
    `

    if (result.length === 0) {
      return NextResponse.json({
        success: true,
        backgroundUrl: "/cerulean-flow.png", // Default background
      })
    }

    return NextResponse.json({
      success: true,
      backgroundUrl: result[0].value,
    })
  } catch (error) {
    console.error("Error getting background image:", error)
    return NextResponse.json({
      success: false,
      message: "Error getting background image",
      backgroundUrl: "/cerulean-flow.png", // Default background on error
    })
  }
}
