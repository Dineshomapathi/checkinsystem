import { NextResponse } from "next/server"
import { getRegistrationById, sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { registration_id, event_id = 1 } = await request.json()

    if (!registration_id) {
      return NextResponse.json({ success: false, message: "Registration ID is required" }, { status: 400 })
    }

    console.log("Processing manual check-in for registration ID:", registration_id, "Event ID:", event_id)

    // Find the registration by ID
    const registration = await getRegistrationById(registration_id)

    if (!registration) {
      console.log("Registration not found:", registration_id)
      return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
    }

    // Check if already checked in today
    const today = new Date().toISOString().split("T")[0] // Get current date in YYYY-MM-DD format

    const checkInToday = await sql`
      SELECT * FROM check_in_logs 
      WHERE registration_id = ${registration.id}
      AND event_id = ${event_id}
      AND DATE(check_in_time) = ${today}
      LIMIT 1
    `

    if (checkInToday.length > 0) {
      console.log("Registration already checked in today:", registration.id)
      return NextResponse.json(
        {
          success: false,
          message: "Already checked in today",
          registration: {
            full_name: registration.full_name,
            company: registration.company,
            table_number: registration.table_number,
          },
        },
        { status: 200 },
      )
    }

    // Add check-in log
    try {
      await sql`
        INSERT INTO check_in_logs (registration_id, event_id, checked_in_by, method, notes)
        VALUES (${registration.id}, ${event_id}, NULL, 'manual', 'Manual check-in by admin')
      `
      console.log("Check-in log created successfully")
    } catch (error) {
      console.error("Error creating check-in log:", error)
      throw error
    }

    // Only update the registration's checked_in status if it hasn't been checked in before
    if (!registration.checked_in) {
      try {
        await sql`
          UPDATE registrations 
          SET checked_in = true, check_in_time = NOW() 
          WHERE id = ${registration.id}
        `
        console.log("Registration checked_in status updated")
      } catch (error) {
        console.error("Error updating registration checked_in status:", error)
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      registration: {
        full_name: registration.full_name,
        company: registration.company,
        table_number: registration.table_number,
      },
    })
  } catch (error) {
    console.error("Error processing manual check-in:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
