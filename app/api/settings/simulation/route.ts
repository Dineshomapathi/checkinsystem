import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getAuthUser } from "@/lib/auth"

// Get current simulation settings
export async function GET() {
  try {
    // Check if user is admin
    const user = getAuthUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const settings = await sql`
      SELECT key, value FROM settings 
      WHERE key IN ('simulation_enabled', 'simulation_date_offset')
    `

    // Convert to an object for easier consumption
    const simulationSettings = {
      enabled: settings.find((s) => s.key === "simulation_enabled")?.value === "true",
      dateOffset: Number.parseInt(settings.find((s) => s.key === "simulation_date_offset")?.value || "0", 10),
    }

    // Get the current simulated date
    const now = new Date()
    now.setDate(now.getDate() + simulationSettings.dateOffset)

    return NextResponse.json({
      success: true,
      settings: simulationSettings,
      currentDate: now.toISOString().split("T")[0],
      actualDate: new Date().toISOString().split("T")[0],
    })
  } catch (error) {
    console.error("Error getting simulation settings:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// Update simulation settings
export async function POST(request: Request) {
  try {
    // Check if user is admin
    const user = getAuthUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { enabled, dateOffset } = await request.json()

    // Validate inputs
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ success: false, message: "Enabled must be a boolean" }, { status: 400 })
    }

    if (typeof dateOffset !== "number" || dateOffset < -365 || dateOffset > 365) {
      return NextResponse.json(
        {
          success: false,
          message: "Date offset must be a number between -365 and 365",
        },
        { status: 400 },
      )
    }

    // Update settings
    await sql`
      UPDATE settings SET value = ${enabled.toString()} WHERE key = 'simulation_enabled'
    `

    await sql`
      UPDATE settings SET value = ${dateOffset.toString()} WHERE key = 'simulation_date_offset'
    `

    // Get the current simulated date
    const now = new Date()
    now.setDate(now.getDate() + dateOffset)

    return NextResponse.json({
      success: true,
      message: "Simulation settings updated successfully",
      currentDate: now.toISOString().split("T")[0],
      actualDate: new Date().toISOString().split("T")[0],
    })
  } catch (error) {
    console.error("Error updating simulation settings:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
