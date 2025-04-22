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
  const user = await getUserByEmail(email)

  if (!user) {
    return null
  }

  // For regular users, check password
  const passwordMatch = await comparePasswords(password, user.password)

  if (!passwordMatch) {
    return null
  }

  // Don't return the password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
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
