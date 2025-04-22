import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "./db"
import bcryptjs from "bcryptjs"

// In a real app, you would use a proper JWT library
// This is a simplified version for demonstration
export async function hashPassword(password: string): Promise<string> {
  return await bcryptjs.hash(password, 10)
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return await bcryptjs.compare(password, hashedPassword)
}

export async function authenticateUser(email: string, password: string) {
  try {
    console.log("Authenticating user:", email)

    // Special case for admin@admin.com
    if (email === "admin@admin.com" && password === "checkin@123") {
      console.log("Using hardcoded admin credentials")

      // Get the user from the database or create it if it doesn't exist
      const user = await getUserByEmail(email)

      if (!user) {
        console.log("Admin user not found in database, using default values")
        // Return a default admin user
        return {
          id: 1,
          name: "Admin User",
          email: "admin@admin.com",
          role: "admin",
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }

    const user = await getUserByEmail(email)

    if (!user) {
      console.log("User not found:", email)
      return null
    }

    // For regular users, check password
    console.log("Comparing passwords for:", email)
    const passwordMatch = await comparePasswords(password, user.password)

    if (!passwordMatch) {
      console.log("Password mismatch for:", email)
      return null
    }

    // Don't return the password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

export function setAuthCookie(userId: number, role: string) {
  // In a real app, you would use a proper JWT
  const authToken = Buffer.from(JSON.stringify({ userId, role })).toString("base64")

  // Use server cookies API
  cookies().set({
    name: "auth_token",
    value: authToken,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: "lax",
  })

  return authToken
}

export function clearAuthCookie() {
  cookies().delete("auth_token")
}

export function getAuthUser(req?: NextRequest) {
  let authToken

  if (req) {
    // For middleware
    authToken = req.cookies.get("auth_token")?.value
  } else {
    // For server components
    authToken = cookies().get("auth_token")?.value
  }

  if (!authToken) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(authToken, "base64").toString())
  } catch (error) {
    return null
  }
}

export function requireAuth(req: NextRequest) {
  const user = getAuthUser(req)

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export function requireAdmin(req: NextRequest) {
  const user = getAuthUser(req)

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (user.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}
