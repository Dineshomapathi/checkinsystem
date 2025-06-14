import { NextResponse } from "next/server"
import { clearAuthCookie } from "@/lib/auth"

export async function POST() {
  clearAuthCookie()

  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  })
}
