import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Calculate offset
    const offset = (page - 1) * limit

    // Get registrations with pagination
    const registrations = await sql`
      SELECT * FROM registrations
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count for pagination
    const countResult = await sql`SELECT COUNT(*) as total FROM registrations`
    const total = Number.parseInt(countResult[0].total)

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      registrations,
      page,
      limit,
      total,
      totalPages,
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch registrations" }, { status: 500 })
  }
}
