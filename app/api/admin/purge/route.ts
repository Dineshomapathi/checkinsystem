import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { del } from "@vercel/blob"
import { getAuthUser } from "@/lib/auth"

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
          -- Delete check-in logs
          DELETE FROM check_in_logs;
          
          -- Delete event registrations
          DELETE FROM event_registrations;
          
          -- Delete registrations
          DELETE FROM registrations;
          
          -- Delete events
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

      case "event":
        if (!eventId) {
          return NextResponse.json({ success: false, message: "Event ID is required" }, { status: 400 })
        }

        // Purge specific event data
        await sql`
          -- Delete check-in logs for this event
          DELETE FROM check_in_logs WHERE event_id = ${eventId};
          
          -- Get registration IDs for this event
          WITH event_regs AS (
            SELECT registration_id FROM event_registrations WHERE event_id = ${eventId}
          )
          
          -- Delete registrations for this event
          DELETE FROM registrations 
          WHERE id IN (SELECT registration_id FROM event_regs);
          
          -- Delete event registrations
          DELETE FROM event_registrations WHERE event_id = ${eventId};
          
          -- Delete the event
          DELETE FROM events WHERE id = ${eventId};
        `

        break

      case "neon":
        // Purge database only
        await sql`
          -- Delete check-in logs
          DELETE FROM check_in_logs;
          
          -- Delete event registrations
          DELETE FROM event_registrations;
          
          -- Delete registrations
          DELETE FROM registrations;
          
          -- Delete events
          DELETE FROM events;
          
          -- Reset settings except background_image
          UPDATE settings SET value = NULL WHERE key != 'background_image';
        `
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
    return NextResponse.json({ success: false, message: "Error during purge operation" }, { status: 500 })
  }
}
