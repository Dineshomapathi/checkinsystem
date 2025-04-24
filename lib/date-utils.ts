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

// Convert UTC date to Malaysia time (GMT+8)
export function convertToMalaysiaTime(date: Date | string | null): Date | null {
  if (!date) return null

  const utcDate = typeof date === "string" ? new Date(date) : date

  // Create a new date object to avoid modifying the original
  const malaysiaDate = new Date(utcDate)

  // Add 8 hours to convert from UTC to Malaysia time (GMT+8)
  malaysiaDate.setHours(malaysiaDate.getHours() + 8)

  return malaysiaDate
}

// Format date for display in Malaysia format
export function formatMalaysiaDateTime(date: Date | string | null): string {
  if (!date) return ""

  const malaysiaDate = convertToMalaysiaTime(date)
  if (!malaysiaDate) return ""

  return malaysiaDate.toLocaleString("en-MY", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

// Format just the date part
export function formatMalaysiaDate(date: Date | string | null): string {
  if (!date) return ""

  const malaysiaDate = convertToMalaysiaTime(date)
  if (!malaysiaDate) return ""

  return malaysiaDate.toLocaleDateString("en-MY")
}

// Format just the time part
export function formatMalaysiaTime(date: Date | string | null): string {
  if (!date) return ""

  const malaysiaDate = convertToMalaysiaTime(date)
  if (!malaysiaDate) return ""

  return malaysiaDate.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}
