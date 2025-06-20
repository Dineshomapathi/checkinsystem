import { NextResponse } from "next/server"
import { getCheckInStats, getRecentCheckIns } from "@/lib/db"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("event_id") ? Number.parseInt(searchParams.get("event_id")!) : undefined

    // Get check-in statistics
    const stats = await getCheckInStats(eventId)

    // Get recent check-ins
    const recentCheckIns = await getRecentCheckIns(5)

    // Get today's check-ins count
    const today = new Date().toISOString().split("T")[0]
    let checkInsToday

    if (eventId) {
      checkInsToday = await sql`
        SELECT COUNT(*) as count 
        FROM check_in_logs 
        WHERE DATE(check_in_time) = ${today}
        AND event_id = ${eventId}
      `
    } else {
      checkInsToday = await sql`
        SELECT COUNT(*) as count 
        FROM check_in_logs 
        WHERE DATE(check_in_time) = ${today}
      `
    }

    // Calculate check-in rate
    const checkInRate =
      stats.total_registrations > 0
        ? ((stats.checked_in_count / stats.total_registrations) * 100).toFixed(1) + "%"
        : "0%"

    return NextResponse.json({
      success: true,
      stats: {
        totalRegistrations: Number.parseInt(stats.total_registrations),
        checkedIn: Number.parseInt(stats.checked_in_count),
        pendingCheckIn: Number.parseInt(stats.pending_count),
        checkInRate,
        checkInsToday: Number.parseInt(checkInsToday[0].count),
        recentCheckIns,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
