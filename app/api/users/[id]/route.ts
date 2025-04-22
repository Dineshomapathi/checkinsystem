import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

// Get a specific user
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    const user = await sql`
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      WHERE id = ${id}
    `

    if (user.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: user[0],
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch user" }, { status: 500 })
  }
}

// Update a user
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    const { name, email, password, role } = await request.json()

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ success: false, message: "Name and email are required" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await sql`SELECT id FROM users WHERE id = ${id}`
    if (existingUser.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if email is already used by another user
    const emailCheck = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${id}`
    if (emailCheck.length > 0) {
      return NextResponse.json({ success: false, message: "Email is already used by another user" }, { status: 409 })
    }

    let result

    // If password is provided, update with new password
    if (password) {
      const hashedPassword = await hashPassword(password)
      result = await sql`
        UPDATE users
        SET name = ${name}, email = ${email}, password = ${hashedPassword}, role = ${role}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, name, email, role
      `
    } else {
      // Otherwise, update without changing password
      result = await sql`
        UPDATE users
        SET name = ${name}, email = ${email}, role = ${role}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, name, email, role
      `
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: result[0],
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 })
  }
}

// Delete a user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await sql`SELECT id FROM users WHERE id = ${id}`
    if (existingUser.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Delete the user
    await sql`DELETE FROM users WHERE id = ${id}`

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ success: false, message: "Failed to delete user" }, { status: 500 })
  }
}
