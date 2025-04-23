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

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.start_date || !body.end_date) {
      return NextResponse.json(
        { success: false, message: "Name, start date, and end date are required fields" },
        { status: 400 },
      )
    }

    // Create event
    const result = await sql`
      INSERT INTO events (
        name, 
        description, 
        location, 
        start_date, 
        end_date
      )
      VALUES (
        ${body.name},
        ${body.description || null},
        ${body.location || null},
        ${body.start_date},
        ${body.end_date}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      event: result[0],
    })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ success: false, message: "Failed to create event" }, { status: 500 })
  }
}
