import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })
    }

    const result = await sql`
      SELECT * FROM events WHERE id = ${id} LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      event: result[0],
    })
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch event" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })
    }

    // Validate required fields
    if (!body.name || !body.start_date || !body.end_date) {
      return NextResponse.json(
        { success: false, message: "Name, start date, and end date are required fields" },
        { status: 400 },
      )
    }

    // Check if event exists
    const existingEvent = await sql`
      SELECT * FROM events WHERE id = ${id} LIMIT 1
    `

    if (existingEvent.length === 0) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Update event
    const result = await sql`
      UPDATE events
      SET 
        name = ${body.name},
        description = ${body.description || null},
        location = ${body.location || null},
        start_date = ${body.start_date},
        end_date = ${body.end_date},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      event: result[0],
    })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ success: false, message: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid event ID" }, { status: 400 })
    }

    // Check if event exists
    const existingEvent = await sql`
      SELECT * FROM events WHERE id = ${id} LIMIT 1
    `

    if (existingEvent.length === 0) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 })
    }

    // Delete check-in logs for this event
    await sql`DELETE FROM check_in_logs WHERE event_id = ${id}`

    // Get registration IDs for this event
    const eventRegistrations = await sql`
      SELECT registration_id FROM event_registrations WHERE event_id = ${id}
    `

    // Delete event registrations
    await sql`DELETE FROM event_registrations WHERE event_id = ${id}`

    // Delete registrations that are only linked to this event
    if (eventRegistrations.length > 0) {
      const registrationIds = eventRegistrations.map((er) => er.registration_id)

      for (const regId of registrationIds) {
        // Check if registration is linked to other events
        const otherEventLinks = await sql`
          SELECT COUNT(*) as count FROM event_registrations 
          WHERE registration_id = ${regId} AND event_id != ${id}
        `

        // Only delete if not linked to other events
        if (otherEventLinks[0].count === 0) {
          await sql`DELETE FROM registrations WHERE id = ${regId}`
        }
      }
    }

    // Delete the event
    await sql`DELETE FROM events WHERE id = ${id}`

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ success: false, message: "Failed to delete event" }, { status: 500 })
  }
}
