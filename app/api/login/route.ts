import { NextResponse } from "next/server"
import { authenticateUser, setAuthCookie } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    console.log("Login attempt for:", email)

    if (!email || !password) {
      console.log("Missing email or password")
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      console.log("Authentication failed for:", email)
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    console.log("Authentication successful for:", email)

    // Set auth cookie
    const token = setAuthCookie(user.id, user.role)

    // Return success response with user info
    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token, // Include token for client-side storage if needed
    })
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
