import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid registration ID" }, { status: 400 })
    }

    const result = await sql`
      SELECT * FROM registrations WHERE id = ${id} LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      registration: result[0],
    })
  } catch (error) {
    console.error("Error fetching registration:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch registration" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid registration ID" }, { status: 400 })
    }

    // Validate required fields
    if (!body.full_name || !body.email) {
      return NextResponse.json({ success: false, message: "Name and email are required fields" }, { status: 400 })
    }

    // Check if registration exists
    const existingReg = await sql`
      SELECT * FROM registrations WHERE id = ${id} LIMIT 1
    `

    if (existingReg.length === 0) {
      return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
    }

    // Check if email already exists (excluding this registration)
    const existingEmail = await sql`
      SELECT id FROM registrations WHERE email = ${body.email} AND id != ${id} LIMIT 1
    `

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { success: false, message: "A registration with this email already exists" },
        { status: 400 },
      )
    }

    // Check if QR code already exists (excluding this registration)
    if (body.qr_code) {
      const existingQR = await sql`
        SELECT id FROM registrations WHERE qr_code = ${body.qr_code} AND id != ${id} LIMIT 1
      `

      if (existingQR.length > 0) {
        return NextResponse.json(
          { success: false, message: "A registration with this QR code already exists" },
          { status: 400 },
        )
      }
    }

    // Update registration
    const result = await sql`
      UPDATE registrations
      SET 
        full_name = ${body.full_name},
        email = ${body.email},
        phone = ${body.phone || null},
        company = ${body.company || null},
        roles = ${body.roles || null},
        table_number = ${body.table_number || null},
        subsidiary = ${body.subsidiary || null},
        vendor_details = ${body.vendor_details || null},
        qr_code = ${body.qr_code || existingReg[0].qr_code},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: "Registration updated successfully",
      registration: result[0],
    })
  } catch (error) {
    console.error("Error updating registration:", error)
    return NextResponse.json({ success: false, message: "Failed to update registration" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid registration ID" }, { status: 400 })
    }

    // Check if registration exists
    const existingReg = await sql`
      SELECT * FROM registrations WHERE id = ${id} LIMIT 1
    `

    if (existingReg.length === 0) {
      return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
    }

    // Delete registration
    await sql`
      DELETE FROM registrations WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: "Registration deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting registration:", error)
    return NextResponse.json({ success: false, message: "Failed to delete registration" }, { status: 500 })
  }
}
