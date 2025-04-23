import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid registration ID" }, { status: 400 })
    }

    // Get events associated with this registration
    const events = await sql`
      SELECT e.* 
      FROM events e
      JOIN event_registrations er ON e.id = er.event_id
      WHERE er.registration_id = ${id}
      ORDER BY e.start_date DESC
    `

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error("Error fetching registration events:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch registration events" }, { status: 500 })
  }
}
