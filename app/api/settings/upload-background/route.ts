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

    // Upload the file to Vercel Blob
    const blob = await put(`backgrounds/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    // Update the background image setting in the database
    await sql`
      UPDATE settings
      SET value = ${blob.url}, updated_at = NOW()
      WHERE key = 'background_image'
    `

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
