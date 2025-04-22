import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "10"

    const checkIns = await sql`
      SELECT 
        cl.id, 
        cl.check_in_time, 
        r.full_name, 
        r.email, 
        r.company,
        r.table_number,
        e.name as event_name,
        u.name as checked_in_by_name
      FROM check_in_logs cl
      JOIN registrations r ON cl.registration_id = r.id
      JOIN events e ON cl.event_id = e.id
      LEFT JOIN users u ON cl.checked_in_by = u.id
      ORDER BY cl.check_in_time DESC
      LIMIT ${Number.parseInt(limit)}
    `

    return NextResponse.json({
      success: true,
      checkIns,
    })
  } catch (error) {
    console.error("Error fetching recent check-ins:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching recent check-ins",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
