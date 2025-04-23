"use client"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  QrCode,
  FileText,
  Settings,
  Menu,
  X,
  UserPlus,
  FileSpreadsheet,
  Camera,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminNavProps {
  setSidebarOpen: (open: boolean) => void
  sidebarOpen: boolean
}

export function AdminNav({ setSidebarOpen, sidebarOpen }: AdminNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Check if the current path is the dashboard with the check-in tab
  const isCheckInTab = pathname === "/admin/dashboard" && searchParams.get("tab") === "check-in"

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin/dashboard" && !isCheckInTab,
    },
    { name: "Manual Check-in", href: "/admin/dashboard?tab=check-in", icon: QrCode, active: isCheckInTab },
    { name: "Camera Check-in", href: "/camera-check-in", icon: Camera, active: pathname === "/camera-check-in" },
    { name: "Events", href: "/admin/events", icon: Calendar, active: pathname === "/admin/events" },
    { name: "Registrations", href: "/admin/registrations", icon: Users, active: pathname === "/admin/registrations" },
    { name: "Platform Users", href: "/admin/users", icon: UserPlus, active: pathname === "/admin/users" },
    {
      name: "Excel Upload",
      href: "/admin/excel-upload",
      icon: FileSpreadsheet,
      active: pathname === "/admin/excel-upload",
    },
    { name: "Reports", href: "/admin/reports", icon: FileText, active: pathname === "/admin/reports" },
    { name: "Settings", href: "/admin/settings", icon: Settings, active: pathname === "/admin/settings" },
  ]

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-background">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-background shadow-lg">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center px-6 border-b">
                <h2 className="text-lg font-semibold">Admin Panel</h2>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm ${
                      item.active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r bg-background">
            <div className="flex h-16 items-center px-6 border-b">
              <h2 className="text-lg font-semibold">Admin Panel</h2>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm ${
                      item.active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
