import { neon } from "@neondatabase/serverless"

// Create a SQL client with the pooled connection
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to format dates for SQL queries
export function formatDateForSQL(date: Date): string {
  return date.toISOString()
}

// User-related database functions
export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `
  return result[0] || null
}

export async function createUser(name: string, email: string, hashedPassword: string, role = "user") {
  const result = await sql`
    INSERT INTO users (name, email, password, role)
    VALUES (${name}, ${email}, ${hashedPassword}, ${role})
    RETURNING id, name, email, role
  `
  return result[0]
}

// Registration-related database functions
export async function getRegistrations(limit = 100, offset = 0) {
  return await sql`
    SELECT * FROM registrations
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
}

export async function getRegistrationByHash(hash: string) {
  console.log("Looking up registration with hash:", hash)

  try {
    // First try an exact match
    let result = await sql`
      SELECT * FROM registrations WHERE qr_code = ${hash} LIMIT 1
    `

    if (result.length > 0) {
      console.log("Found registration with exact hash match")
      return result[0]
    }

    // If no exact match, try trimming whitespace
    const trimmedHash = hash.trim()
    if (trimmedHash !== hash) {
      result = await sql`
        SELECT * FROM registrations WHERE qr_code = ${trimmedHash} LIMIT 1
      `

      if (result.length > 0) {
        console.log("Found registration with trimmed hash match")
        return result[0]
      }
    }

    // If still no match, try a case-insensitive match
    result = await sql`
      SELECT * FROM registrations WHERE LOWER(qr_code) = LOWER(${hash}) LIMIT 1
    `

    if (result.length > 0) {
      console.log("Found registration with case-insensitive hash match")
      return result[0]
    }

    console.log("No registration found with hash:", hash)
    return null
  } catch (error) {
    console.error("Error looking up registration by hash:", error)
    throw error
  }
}

export async function getRegistrationById(id: number) {
  const result = await sql`
    SELECT * FROM registrations WHERE id = ${id} LIMIT 1
  `
  return result[0] || null
}

export async function searchRegistrations(query: string) {
  return await sql`
    SELECT * FROM registrations 
    WHERE full_name ILIKE ${"%" + query + "%"} 
    OR email ILIKE ${"%" + query + "%"}
    OR company ILIKE ${"%" + query + "%"}
    ORDER BY full_name
    LIMIT 20
  `
}

export async function checkInRegistration(
  registrationId: number,
  userId: number | null,
  eventId: number,
  method = "qr",
  notes = "",
) {
  try {
    // Update the registration record
    await sql`
      UPDATE registrations 
      SET checked_in = true, check_in_time = NOW() 
      WHERE id = ${registrationId} AND checked_in = false
    `

    // Add a check-in log
    await sql`
      INSERT INTO check_in_logs (registration_id, event_id, checked_in_by, method, notes)
      VALUES (${registrationId}, ${eventId}, ${userId}, ${method}, ${notes})
    `

    // Get the updated registration
    return await getRegistrationById(registrationId)
  } catch (error) {
    console.error("Error checking in registration:", error)
    throw error
  }
}

// Event-related database functions
export async function getEvents() {
  return await sql`
    SELECT * FROM events
    ORDER BY start_date DESC
  `
}

export async function getEventById(id: number) {
  const result = await sql`
    SELECT * FROM events WHERE id = ${id} LIMIT 1
  `
  return result[0] || null
}

export async function createEvent(name: string, description: string, location: string, startDate: Date, endDate: Date) {
  const result = await sql`
    INSERT INTO events (name, description, location, start_date, end_date)
    VALUES (${name}, ${description}, ${location}, ${formatDateForSQL(startDate)}, ${formatDateForSQL(endDate)})
    RETURNING *
  `
  return result[0]
}

// Check-in statistics
export async function getCheckInStats(eventId?: number) {
  let query

  if (eventId) {
    query = sql`
      SELECT 
        COUNT(*) as total_registrations,
        SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as checked_in_count,
        COUNT(*) - SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as pending_count
      FROM registrations r
      JOIN event_registrations er ON r.id = er.registration_id
      WHERE er.event_id = ${eventId}
    `
  } else {
    query = sql`
      SELECT 
        COUNT(*) as total_registrations,
        SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as checked_in_count,
        COUNT(*) - SUM(CASE WHEN checked_in = true THEN 1 ELSE 0 END) as pending_count
      FROM registrations
    `
  }

  const result = await query
  return result[0]
}

// Recent check-ins
export async function getRecentCheckIns(limit = 5) {
  return await sql`
    SELECT 
      cl.id, 
      cl.check_in_time, 
      r.full_name, 
      r.email, 
      r.company,
      r.table_number,
      e.name as event_name,
      u.name as checked_in_by_name
    FROM check_in_logs cl
    JOIN registrations r ON cl.registration_id = r.id
    JOIN events e ON cl.event_id = e.id
    LEFT JOIN users u ON cl.checked_in_by = u.id
    ORDER BY cl.check_in_time DESC
    LIMIT ${limit}
  `
}
