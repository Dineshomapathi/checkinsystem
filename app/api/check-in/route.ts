import { NextResponse } from "next/server"
import { getRegistrationByHash } from "@/lib/db"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { qr_code, event_id = 1 } = await request.json()

    if (!qr_code) {
      console.log("QR code is missing in request")
      return NextResponse.json(
        { success: false, message: "QR code is required" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    }

    console.log("Processing check-in for QR code:", qr_code, "Event ID:", event_id)

    // Find the registration by hash (stored in qr_code field)
    const registration = await getRegistrationByHash(qr_code)

    if (!registration) {
      console.log("No registration found for QR code:", qr_code)
      return NextResponse.json(
        { success: false, message: "Invalid QR code. Registration not found." },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    }

    console.log("Found registration:", registration.id, registration.full_name)

    // Check if already checked in TODAY for THIS event
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
          message: "Already checked in today. Please come back tomorrow for next check-in.",
          registration: {
            full_name: registration.full_name,
            company: registration.company,
            table_number: registration.table_number,
          },
        },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    }

    // Add check-in log for today
    console.log("Checking in registration:", registration.id, "for event:", event_id)

    try {
      await sql`
        INSERT INTO check_in_logs (registration_id, event_id, checked_in_by, method, notes)
        VALUES (${registration.id}, ${event_id}, NULL, 'qr', 'Check-in via QR code')
      `
      console.log("Check-in log created successfully")
    } catch (error) {
      console.error("Error creating check-in log:", error)
      throw error
    }

    // Update the registration's checked_in status if this is their first check-in ever
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

    console.log("Check-in successful for registration:", registration.id)
    return NextResponse.json(
      {
        success: true,
        message: "Check-in successful",
        registration: {
          full_name: registration.full_name,
          company: registration.company,
          table_number: registration.table_number,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
  } catch (error) {
    console.error("Error processing check-in:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
