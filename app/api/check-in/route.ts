import { NextResponse } from "next/server"
import { getRegistrationByHash, checkInRegistration } from "@/lib/db"

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

    console.log("Processing check-in for QR code:", qr_code)

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

    // Check if already checked in
    if (registration.checked_in) {
      console.log("Registration already checked in:", registration.id)
      return NextResponse.json(
        {
          success: false,
          message: "Already checked in",
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

    // Update check-in status
    console.log("Checking in registration:", registration.id)
    const updatedRegistration = await checkInRegistration(
      registration.id,
      null, // No user ID for self check-in
      event_id,
      "qr",
      "Self check-in via QR code",
    )

    console.log("Check-in successful for registration:", registration.id)
    return NextResponse.json(
      {
        success: true,
        message: "Check-in successful",
        registration: {
          full_name: updatedRegistration.full_name,
          company: updatedRegistration.company,
          table_number: updatedRegistration.table_number,
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
