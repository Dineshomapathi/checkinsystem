import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("event_id")

    let query

    if (eventId) {
      // Get names for a specific event
      query = sql`
        SELECT r.full_name
        FROM registrations r
        JOIN event_registrations er ON r.id = er.registration_id
        WHERE er.event_id = ${Number.parseInt(eventId)}
        ORDER BY r.full_name
      `
    } else {
      // Get all names
      query = sql`
        SELECT full_name
        FROM registrations
        ORDER BY full_name
      `
    }

    const result = await query
    const names = result.map((row: any) => row.full_name)

    return NextResponse.json({
      success: true,
      names,
      count: names.length,
    })
  } catch (error) {
    console.error("Error fetching registration names:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching registration names",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
