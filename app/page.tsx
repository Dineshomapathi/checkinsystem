import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Event Check-in System</h1>
          <Link href="/login">
            <Button variant="outline" className="bg-white text-primary hover:bg-gray-100">
              Admin Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold tracking-tight">Welcome to the Event Check-in System</h2>
          <p className="text-xl text-muted-foreground">
            A modern solution for event registration and attendance tracking
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-card p-8 rounded-lg shadow-md border">
              <h3 className="text-2xl font-semibold mb-4">Attendee Check-in</h3>
              <p className="mb-6">Scan your QR code to check in to the event</p>
              <Link href="/check-in">
                <Button className="w-full">Go to Check-in</Button>
              </Link>
            </div>

            <div className="bg-card p-8 rounded-lg shadow-md border">
              <h3 className="text-2xl font-semibold mb-4">Admin Portal</h3>
              <p className="mb-6">Manage registrations, view reports, and more</p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-6 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Event Check-in System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
