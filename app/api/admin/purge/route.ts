import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { del } from "@vercel/blob"
import { getAuthUser } from "@/lib/auth"
// Import the purgeRegistrations function
import { purgeRegistrations } from "@/lib/db"

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const user = getAuthUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { type, eventId } = await request.json()

    const result = { success: true, message: "Purge completed successfully" }

    switch (type) {
      case "full":
        // Purge everything except users table
        await sql`
          -- Delete check-in logs first (they reference registrations and events)
          DELETE FROM check_in_logs;
          
          -- Delete event registrations (they reference both events and registrations)
          DELETE FROM event_registrations;
          
          -- Now we can delete registrations
          DELETE FROM registrations;
          
          -- Finally delete events
          DELETE FROM events;
          
          -- Reset settings except background_image
          UPDATE settings SET value = NULL WHERE key != 'background_image';
        `

        // Delete all blobs
        try {
          const blobsResponse = await fetch("https://api.vercel.com/v9/blobs", {
            headers: {
              Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
          })

          const blobsData = await blobsResponse.json()

          if (blobsData.blobs && Array.isArray(blobsData.blobs)) {
            for (const blob of blobsData.blobs) {
              await del(blob.url)
            }
          }
        } catch (blobError) {
          console.error("Error purging blobs:", blobError)
          result.message = "Database purged successfully, but there was an error purging blobs"
        }

        break

      case "registrations":
        // Purge only registrations and check-in logs, respecting foreign key constraints
        try {
          const result = await purgeRegistrations()
          return NextResponse.json(result)
        } catch (error) {
          console.error("Error during registrations purge:", error)
          return NextResponse.json(
            {
              success: false,
              message: "Error purging registrations: " + (error instanceof Error ? error.message : String(error)),
            },
            { status: 500 },
          )
        }
        break

      case "event":
        if (!eventId) {
          return NextResponse.json({ success: false, message: "Event ID is required" }, { status: 400 })
        }

        // Purge specific event data, respecting foreign key constraints
        try {
          // First delete check-in logs for this event
          await sql`DELETE FROM check_in_logs WHERE event_id = ${eventId};`

          // Get registration IDs for this event
          const eventRegistrations = await sql`
            SELECT registration_id FROM event_registrations WHERE event_id = ${eventId}
          `

          // Delete event registrations
          await sql`DELETE FROM event_registrations WHERE event_id = ${eventId};`

          // Delete registrations for this event if they're not linked to other events
          if (eventRegistrations.length > 0) {
            const registrationIds = eventRegistrations.map((er) => er.registration_id)

            for (const regId of registrationIds) {
              // Check if registration is linked to other events
              const otherEventLinks = await sql`
                SELECT COUNT(*) as count FROM event_registrations 
                WHERE registration_id = ${regId} AND event_id != ${eventId}
              `

              // Only delete if not linked to other events
              if (otherEventLinks[0].count === 0) {
                await sql`DELETE FROM registrations WHERE id = ${regId};`
              }
            }
          }

          // Delete the event
          await sql`DELETE FROM events WHERE id = ${eventId};`
        } catch (error) {
          console.error("Error during event purge:", error)
          return NextResponse.json(
            {
              success: false,
              message: "Error purging event: " + (error instanceof Error ? error.message : String(error)),
            },
            { status: 500 },
          )
        }
        break

      case "neon":
        // Purge database only, respecting foreign key constraints
        try {
          // Delete check-in logs first
          await sql`DELETE FROM check_in_logs;`

          // Delete event registrations
          await sql`DELETE FROM event_registrations;`

          // Delete registrations
          await sql`DELETE FROM registrations;`

          // Delete events
          await sql`DELETE FROM events;`

          // Reset settings except background_image
          await sql`UPDATE settings SET value = NULL WHERE key != 'background_image';`
        } catch (error) {
          console.error("Error during database purge:", error)
          return NextResponse.json(
            {
              success: false,
              message: "Error purging database: " + (error instanceof Error ? error.message : String(error)),
            },
            { status: 500 },
          )
        }
        break

      case "blob":
        // Purge blobs only
        try {
          const blobsResponse = await fetch("https://api.vercel.com/v9/blobs", {
            headers: {
              Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
          })

          const blobsData = await blobsResponse.json()

          if (blobsData.blobs && Array.isArray(blobsData.blobs)) {
            for (const blob of blobsData.blobs) {
              await del(blob.url)
            }
          }
        } catch (blobError) {
          console.error("Error purging blobs:", blobError)
          return NextResponse.json({ success: false, message: "Error purging blobs" }, { status: 500 })
        }
        break

      default:
        return NextResponse.json({ success: false, message: "Invalid purge type" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error during purge operation:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error during purge operation: " + (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    )
  }
}
