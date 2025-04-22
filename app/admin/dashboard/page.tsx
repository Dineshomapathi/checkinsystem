"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Search, UserCheck, Users, Clock, CalendarCheck } from "lucide-react"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [stats, setStats] = useState({
    totalRegistrations: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    checkInsToday: 0,
    recentCheckIns: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(tabParam === "check-in" ? "check-in" : "overview")

  // Manual check-in state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [qrCode, setQrCode] = useState("")
  const [checkInResult, setCheckInResult] = useState<any | null>(null)
  const { toast } = useToast()

  // Update active tab when URL query parameter changes
  useEffect(() => {
    if (tabParam === "check-in") {
      setActiveTab("check-in")
    } else {
      setActiveTab("overview")
    }
  }, [tabParam])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard-stats")
        const data = await response.json()

        if (data.success) {
          setStats(data.stats)
        } else {
          console.error("Failed to fetch dashboard stats:", data.message)
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search-registration?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.registrations)
        if (data.registrations.length === 0) {
          toast({
            title: "No results found",
            description: "No registrations match your search query.",
            variant: "warning",
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to search registrations",
          variant: "destructive",
        })
        setSearchResults([])
      }
    } catch (error) {
      console.error("Error searching registrations:", error)
      toast({
        title: "Error",
        description: "Failed to search registrations. Please try again.",
        variant: "destructive",
      })
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleCheckIn = async (registrationId: number) => {
    try {
      const response = await fetch("/api/manual-check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registration_id: registrationId }),
      })

      const data = await response.json()
      setCheckInResult(data)

      if (data.success) {
        toast({
          title: "Success",
          description: `${data.registration.full_name} has been checked in.`,
        })
        // Update the search results to reflect the check-in
        setSearchResults(
          searchResults.map((reg) =>
            reg.id === registrationId ? { ...reg, checked_in: true, check_in_time: new Date().toISOString() } : reg,
          ),
        )

        // Refresh stats
        const statsResponse = await fetch("/api/dashboard-stats")
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.stats)
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to check in registration",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking in registration:", error)
      toast({
        title: "Error",
        description: "Failed to check in registration. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleQrCheckIn = async () => {
    if (!qrCode.trim()) return

    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qr_code: qrCode }),
      })

      const data = await response.json()
      setCheckInResult(data)

      if (data.success) {
        toast({
          title: "Success",
          description: `${data.registration.full_name} has been checked in.`,
        })
        setQrCode("")

        // Refresh stats
        const statsResponse = await fetch("/api/dashboard-stats")
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.stats)
        }
      } else if (data.message && data.message.includes("Already checked in")) {
        toast({
          title: "Already Checked In",
          description: data.registration
            ? `${data.registration.full_name} is already checked in.`
            : "This person is already checked in.",
          variant: "warning",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Invalid QR Code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing check-in:", error)
      toast({
        title: "Error",
        description: "Failed to process check-in. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="check-in">Manual Check-in</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalRegistrations}</div>
                <p className="text-xs text-muted-foreground">Total registered attendees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.checkedIn}</div>
                <p className="text-xs text-muted-foreground">
                  {isLoading
                    ? "..."
                    : `${((stats.checkedIn / stats.totalRegistrations) * 100 || 0).toFixed(1)}% of total`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Not Checked In</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.notCheckedIn}</div>
                <p className="text-xs text-muted-foreground">Awaiting check-in</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stats.checkInsToday}</div>
                <p className="text-xs text-muted-foreground">Check-ins in the last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Check-ins</CardTitle>
                <CardDescription>Recent attendees who have checked in</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-muted"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-40 rounded bg-muted"></div>
                            <div className="h-4 w-24 rounded bg-muted"></div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : stats.recentCheckIns && stats.recentCheckIns.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentCheckIns.map((checkIn: any) => (
                      <div key={checkIn.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{checkIn.full_name}</p>
                          <p className="text-sm text-muted-foreground">{checkIn.email}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(checkIn.check_in_time).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No recent check-ins</p>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Check-in Statistics</CardTitle>
                <CardDescription>Check-in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div>Checked In</div>
                      <div className="font-medium">
                        {isLoading ? "..." : `${((stats.checkedIn / stats.totalRegistrations) * 100 || 0).toFixed(1)}%`}
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: isLoading ? "0%" : `${(stats.checkedIn / stats.totalRegistrations) * 100 || 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div>Not Checked In</div>
                      <div className="font-medium">
                        {isLoading
                          ? "..."
                          : `${((stats.notCheckedIn / stats.totalRegistrations) * 100 || 0).toFixed(1)}%`}
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-amber-500"
                        style={{
                          width: isLoading ? "0%" : `${(stats.notCheckedIn / stats.totalRegistrations) * 100 || 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="check-in" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Check-in</CardTitle>
              <CardDescription>Search for registrations by name, email, or company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, email, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? "Searching..." : "Search"}
                  <Search className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Search Results</h3>
                  <div className="border rounded-md divide-y">
                    {searchResults.map((registration) => (
                      <div key={registration.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{registration.full_name}</p>
                          <p className="text-sm text-muted-foreground">{registration.email}</p>
                          {registration.company && <p className="text-sm">{registration.company}</p>}
                        </div>
                        <div>
                          {registration.checked_in ? (
                            <div className="text-sm text-green-600">
                              Checked in at{" "}
                              {new Date(registration.check_in_time).toLocaleString(undefined, {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </div>
                          ) : (
                            <Button onClick={() => handleCheckIn(registration.id)}>Check In</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Code Check-in</CardTitle>
              <CardDescription>Enter a QR code hash manually</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-code">QR Code Hash</Label>
                  <div className="flex gap-2">
                    <Input
                      id="qr-code"
                      placeholder="Enter QR code hash..."
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleQrCheckIn()}
                    />
                    <Button onClick={handleQrCheckIn}>Check In</Button>
                  </div>
                </div>

                {checkInResult && (
                  <div
                    className={`p-4 rounded-md ${
                      checkInResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    <p className="font-medium">{checkInResult.message}</p>
                    {checkInResult.registration && (
                      <div className="mt-2">
                        <p>Name: {checkInResult.registration.full_name}</p>
                        {checkInResult.registration.company && <p>Company: {checkInResult.registration.company}</p>}
                        {checkInResult.registration.table_number && (
                          <p>Table: {checkInResult.registration.table_number}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}
