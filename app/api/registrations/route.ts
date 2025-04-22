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

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.full_name || !body.email) {
      return NextResponse.json({ success: false, message: "Name and email are required fields" }, { status: 400 })
    }

    // Check if email already exists
    const existingEmail = await sql`
      SELECT id FROM registrations WHERE email = ${body.email} LIMIT 1
    `

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { success: false, message: "A registration with this email already exists" },
        { status: 400 },
      )
    }

    // Check if QR code already exists
    if (body.qr_code) {
      const existingQR = await sql`
        SELECT id FROM registrations WHERE qr_code = ${body.qr_code} LIMIT 1
      `

      if (existingQR.length > 0) {
        return NextResponse.json(
          { success: false, message: "A registration with this QR code already exists" },
          { status: 400 },
        )
      }
    }

    // Create registration
    const result = await sql`
      INSERT INTO registrations (
        full_name, 
        email, 
        phone, 
        company, 
        roles, 
        table_number, 
        subsidiary, 
        vendor_details, 
        qr_code,
        checked_in
      )
      VALUES (
        ${body.full_name},
        ${body.email},
        ${body.phone || null},
        ${body.company || null},
        ${body.roles || null},
        ${body.table_number || null},
        ${body.subsidiary || null},
        ${body.vendor_details || null},
        ${body.qr_code || btoa(body.email)},
        false
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Registration created successfully",
      registration: result[0],
    })
  } catch (error) {
    console.error("Error creating registration:", error)
    return NextResponse.json({ success: false, message: "Failed to create registration" }, { status: 500 })
  }
}
