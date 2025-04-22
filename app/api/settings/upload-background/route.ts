import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
    }

    console.log("Uploading background image:", file.name, file.type, file.size)

    // Upload the file to Vercel Blob
    const blob = await put(`backgrounds/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    console.log("Blob upload successful:", blob.url)

    // Update the background image setting in the database
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('background_image', ${blob.url})
      ON CONFLICT (key) DO UPDATE
      SET value = ${blob.url}, updated_at = NOW()
    `

    console.log("Database updated with new background URL")

    return NextResponse.json({
      success: true,
      url: blob.url,
      message: "Background image uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading background image:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error uploading background image",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
