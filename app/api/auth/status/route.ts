import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = getAuthUser()

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: "Not authenticated",
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        userId: user.userId,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Error checking auth status:", error)
    return NextResponse.json(
      {
        authenticated: false,
        message: "Error checking authentication status",
      },
      { status: 500 },
    )
  }
}
