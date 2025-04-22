import { NextResponse } from "next/server"
import { searchRegistrations } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ success: false, message: "Search query is required" }, { status: 400 })
    }

    const registrations = await searchRegistrations(query)

    return NextResponse.json({
      success: true,
      registrations,
    })
  } catch (error) {
    console.error("Error searching registrations:", error)
    return NextResponse.json({ success: false, message: "Failed to search registrations" }, { status: 500 })
  }
}
