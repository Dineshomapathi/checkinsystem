import { NextResponse } from "next/server"
import { getRegistrationById, checkInRegistration } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { registration_id, event_id = 1 } = await request.json()

    if (!registration_id) {
      return NextResponse.json({ success: false, message: "Registration ID is required" }, { status: 400 })
    }

    // Find the registration by ID
    const registration = await getRegistrationById(registration_id)

    if (!registration) {
      return NextResponse.json({ success: false, message: "Registration not found" }, { status: 404 })
    }

    // Check if already checked in
    if (registration.checked_in) {
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
        { status: 200 },
      )
    }

    // Update check-in status
    const updatedRegistration = await checkInRegistration(
      registration.id,
      null, // TODO: Get the user ID from the session
      event_id,
      "manual",
      "Manual check-in by admin",
    )

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      registration: {
        full_name: updatedRegistration.full_name,
        company: updatedRegistration.company,
        table_number: updatedRegistration.table_number,
      },
    })
  } catch (error) {
    console.error("Error processing manual check-in:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
