import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireAuth, requireAdmin } from "./lib/auth"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    })
  }

  // Add CORS headers to all responses
  const response = NextResponse.next()
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

  // Allow access to login page and API routes
  if (path === "/login" || path.startsWith("/api/login")) {
    return response
  }

  // Protect admin routes
  if (path.startsWith("/admin")) {
    return requireAdmin(request)
  }

  // Protect check-in route (optional, remove if you want it public)
  if (path === "/check-in") {
    return requireAuth(request)
  }

  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/check-in",
    "/login",
    "/api/login",
    "/api/:path*", // Add this to handle CORS for all API routes
  ],
}
