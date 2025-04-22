import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const events = await sql`
      SELECT id, name, description, location, start_date, end_date
      FROM events
      ORDER BY start_date DESC
    `

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching events",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
