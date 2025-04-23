import { sql } from "./db"
import * as XLSX from "xlsx"

interface RegistrationData {
  company?: string
  name: string
  email: string
  roles?: string
  vendor_details?: string
  subsidiary?: string
  hash: string
}

export async function parseExcelFile(file: ArrayBuffer): Promise<RegistrationData[]> {
  try {
    // Read the Excel file
    const workbook = XLSX.read(file, { type: "array" })

    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet)

    // Map the data to our RegistrationData interface
    return data
      .map((row: any) => {
        // Handle different possible column names
        return {
          company: row["Company"] || row["company"] || "",
          name: row["Name"] || row["name"] || row["Full Name"] || row["full_name"] || "",
          email: row["Email"] || row["email"] || "",
          roles: row["Roles"] || row["roles"] || row["Role"] || row["role"] || "",
          vendor_details: row["Vendor details"] || row["vendor_details"] || row["Vendor Details"] || "",
          subsidiary: row["Subsidary"] || row["Subsidiary"] || row["subsidiary"] || "",
          hash: row["Hash"] || row["hash"] || "",
        }
      })
      .filter((reg) => {
        // Filter out rows without required fields
        if (!reg.name || !reg.email || !reg.hash) {
          console.warn(`Skipping row with missing required fields: ${JSON.stringify(reg)}`)
          return false
        }
        return true
      })
  } catch (error) {
    console.error("Error parsing Excel file:", error)
    throw new Error("Failed to parse Excel file")
  }
}

export function generateExcelTemplate(): ArrayBuffer {
  // Create a new workbook
  const wb = XLSX.utils.book_new()

  // Sample data with headers
  const data = [
    {
      Company: "ABC Corporation",
      Name: "John Doe",
      Email: "john.doe@example.com",
      Roles: "Developer",
      "Vendor details": "External Contractor",
      Subsidary: "Tech Division",
      Hash: "am9obi5kb2VAZXhhbXBsZS5jb20=", // Base64 encoded email
    },
    {
      Company: "",
      Name: "",
      Email: "",
      Roles: "",
      "Vendor details": "",
      Subsidary: "",
      Hash: "",
    },
  ]

  // Create a worksheet
  const ws = XLSX.utils.json_to_sheet(data)

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Registrations")

  // Generate Excel file
  return XLSX.write(wb, { type: "array", bookType: "xlsx" })
}

// Update the processRegistrationsUpload function to track failed records
export async function processRegistrationsUpload(
  registrations: RegistrationData[],
  eventId?: number,
): Promise<{
  total: number
  successful: number
  failed: number
  errors: string[]
  failedRecords: Array<{ record: RegistrationData; reason: string }>
}> {
  const results = {
    total: registrations.length,
    successful: 0,
    failed: 0,
    errors: [] as string[],
    failedRecords: [] as Array<{ record: RegistrationData; reason: string }>,
  }

  // Process each registration individually without a transaction
  // This avoids the "a.ll.begin is not a function" error
  for (const reg of registrations) {
    try {
      // Validate required fields
      if (!reg.name || !reg.email || !reg.hash) {
        results.failed++
        const reason =
          `Missing required fields: ${!reg.name ? "name" : ""}${!reg.email ? " email" : ""}${!reg.hash ? " hash" : ""}`.trim()
        results.errors.push(`Missing required fields for ${reg.email || reg.name || "unknown record"}`)
        results.failedRecords.push({ record: reg, reason })
        continue
      }

      // Insert the registration using the hash as the QR code
      const newRegistration = await sql`
        INSERT INTO registrations (
          full_name, 
          email, 
          qr_code, 
          company, 
          roles, 
          vendor_details, 
          subsidiary
        )
        VALUES (
          ${reg.name}, 
          ${reg.email}, 
          ${reg.hash}, 
          ${reg.company || null}, 
          ${reg.roles || null}, 
          ${reg.vendor_details || null}, 
          ${reg.subsidiary || null}
        )
        ON CONFLICT (qr_code) DO UPDATE
        SET 
          full_name = ${reg.name}, 
          email = ${reg.email},
          company = ${reg.company || null},
          roles = ${reg.roles || null},
          vendor_details = ${reg.vendor_details || null},
          subsidiary = ${reg.subsidiary || null},
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `

      // If an event ID was provided, link the registration to the event
      if (eventId && newRegistration[0]?.id) {
        await sql`
          INSERT INTO event_registrations (event_id, registration_id)
          VALUES (${eventId}, ${newRegistration[0].id})
          ON CONFLICT (event_id, registration_id) DO NOTHING
        `
      }

      results.successful++
    } catch (error) {
      console.error("Error processing registration:", error)
      results.failed++
      const errorMessage = (error as Error).message
      results.errors.push(`Error processing ${reg.email}: ${errorMessage}`)
      results.failedRecords.push({
        record: reg,
        reason: `Database error: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? "..." : ""}`,
      })
    }
  }

  return results
}

// Helper function to hash an email (for future use)
export function hashEmail(email: string): string {
  // In a real app, you would use a proper hashing algorithm
  // This is a simple example using base64 encoding
  return Buffer.from(email).toString("base64")
}
