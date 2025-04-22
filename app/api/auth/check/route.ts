import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"

export async function GET() {
  const user = getAuthUser()

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: user.userId,
      role: user.role,
    },
  })
}
