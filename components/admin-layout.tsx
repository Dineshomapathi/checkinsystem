"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AdminNav } from "./admin-nav"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        // Clear client-side token
        localStorage.removeItem("auth_token")

        toast({
          title: "Success",
          description: "You have been logged out successfully.",
        })

        // Redirect to home page
        router.push("/")
      } else {
        toast({
          title: "Error",
          description: "Failed to log out. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during logout. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-screen bg-muted/20">
      <Suspense fallback={<div className="w-64 bg-muted/10"></div>}>
        <AdminNav setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />
      </Suspense>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>

        {/* Logout button for mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed bottom-0 left-0 w-64 p-4 border-t bg-background lg:hidden">
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        )}

        {/* Logout button for desktop sidebar */}
        <div className="hidden lg:block lg:absolute lg:bottom-0 lg:left-0 lg:w-64 lg:p-4 lg:border-t lg:bg-background">
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
