import { sql } from "./db"

// Function to get the current date, considering simulation settings if enabled
export async function getCurrentDate(): Promise<Date> {
  try {
    // Get simulation settings
    const simulationSettings = await sql`
      SELECT key, value FROM settings 
      WHERE key IN ('simulation_enabled', 'simulation_date_offset')
    `

    // Convert to a map for easier access
    const settings = new Map(simulationSettings.map((s) => [s.key, s.value]))

    // Check if simulation is enabled
    const simulationEnabled = settings.get("simulation_enabled") === "true"

    if (simulationEnabled) {
      // Get the offset in days
      const offsetDays = Number.parseInt(settings.get("simulation_date_offset") || "0", 10)

      // Create a new date with the offset
      const now = new Date()
      now.setDate(now.getDate() + offsetDays)
      return now
    }

    // If simulation is not enabled, return the actual current date
    return new Date()
  } catch (error) {
    console.error("Error getting simulated date:", error)
    // Fall back to actual date if there's an error
    return new Date()
  }
}

// Function to get just the date part as a string in YYYY-MM-DD format
export async function getCurrentDateString(): Promise<string> {
  const date = await getCurrentDate()
  return date.toISOString().split("T")[0]
}
