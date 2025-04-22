import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("event_id")

    let query

    if (eventId) {
      query = sql`
        SELECT 
          COUNT(*) as total_registrations,
          SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as checked_in_count,
          COUNT(*) - SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as pending_count
        FROM registrations r
        JOIN event_registrations er ON r.id = er.registration_id
        WHERE er.event_id = ${Number.parseInt(eventId)}
      `
    } else {
      query = sql`
        SELECT 
          COUNT(*) as total_registrations,
          SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as checked_in_count,
          COUNT(*) - SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as pending_count
        FROM registrations
      `
    }

    const result = await query
    const stats = result[0]

    return NextResponse.json({
      success: true,
      stats: {
        totalRegistrations: Number.parseInt(stats.total_registrations) || 0,
        checkedIn: Number.parseInt(stats.checked_in_count) || 0,
        pendingCheckIn: Number.parseInt(stats.pending_count) || 0,
        checkInRate:
          stats.total_registrations > 0
            ? ((Number.parseInt(stats.checked_in_count) / Number.parseInt(stats.total_registrations)) * 100).toFixed(
                1,
              ) + "%"
            : "0%",
      },
    })
  } catch (error) {
    console.error("Error fetching check-in stats:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching check-in stats",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
