"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { User } from "@/types"
import {
  ArrowLeft,
  Shield,
  Activity,
  Search,
  X,
  Calendar,
  User as UserIcon,
  FileText,
  Key,
} from "lucide-react"

interface AuditLog {
  id: number
  username: string
  action: string
  resource: string | null
  details: string | null
  ip_address: string
  user_agent: string
  timestamp: number
}

interface AuditStats {
  total: number
  last24Hours: Array<{ action: string; count: number }>
  topUsersLastWeek: Array<{ username: string; count: number }>
}

export default function AuditLogsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchUsername, setSearchUsername] = useState("")
  const [searchAction, setSearchAction] = useState("")
  const [searchResource, setSearchResource] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [limit] = useState(100)
  const [offset, setOffset] = useState(0)
  const [isCleaning, setIsCleaning] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await apiClient.getMe()
        if (!currentUser) {
          router.push("/")
          return
        }

        if (currentUser.role !== "admin") {
          router.push("/dashboard")
          return
        }

        setUser(currentUser)

        // Load audit logs
        await loadAuditLogs()

        // Load stats
        const statsResponse = await fetch("/api/audit?stats=true", {
          credentials: "include",
        })
        const statsData = await statsResponse.json()
        setStats(statsData)
      } catch (error) {
        console.error("Failed to load audit logs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadAuditLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (searchUsername) params.append("username", searchUsername)
      if (searchAction) params.append("action", searchAction)
      if (searchResource) params.append("resource", searchResource)

      // Convert dates to Unix timestamps
      if (startDate) {
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
        params.append("startDate", startTimestamp.toString())
      }
      if (endDate) {
        // Set to end of day (23:59:59)
        const endTimestamp = Math.floor(new Date(endDate + "T23:59:59").getTime() / 1000)
        params.append("endDate", endTimestamp.toString())
      }

      params.append("limit", limit.toString())
      params.append("offset", offset.toString())

      const response = await fetch(`/api/audit?${params.toString()}`, {
        credentials: "include",
      })
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error("Failed to load audit logs:", error)
    }
  }

  const handleSearch = () => {
    setOffset(0)
    loadAuditLogs()
  }

  const handleCleanup = async () => {
    if (!confirm("Are you sure you want to clean old audit logs? This action cannot be undone.")) {
      return
    }

    setIsCleaning(true)
    try {
      const response = await fetch("/api/audit/cleanup", {
        method: "POST",
        credentials: "include",
      })
      const data = await response.json()

      if (response.ok) {
        alert(`Success! Deleted ${data.deletedCount} old audit logs (retention: ${data.retentionDays} days)`)
        // Reload data
        await loadAuditLogs()
        const statsResponse = await fetch("/api/audit?stats=true", {
          credentials: "include",
        })
        const statsData = await statsResponse.json()
        setStats(statsData)
      } else {
        throw new Error(data.error || "Failed to clean audit logs")
      }
    } catch (error: any) {
      alert(error.message || "Failed to clean audit logs")
    } finally {
      setIsCleaning(false)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getActionColor = (action: string) => {
    if (action.includes("created")) return "text-green-600 bg-green-50 dark:bg-green-950"
    if (action.includes("deleted")) return "text-red-600 bg-red-50 dark:bg-red-950"
    if (action.includes("failed")) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950"
    if (action.includes("success")) return "text-blue-600 bg-blue-50 dark:bg-blue-950"
    return "text-gray-600 bg-gray-50 dark:bg-gray-900"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                Audit Logs
              </h1>
              <p className="text-muted-foreground mt-1">
                Security and activity monitoring • Retention: {process.env.NEXT_PUBLIC_AUDIT_RETENTION_DAYS || "2"} days
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleCleanup}
            disabled={isCleaning}
          >
            {isCleaning ? "Cleaning..." : "Clean Old Logs"}
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.last24Hours.reduce((sum, item) => sum + (item.count as any), 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.last24Hours.length} different actions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Top User (7 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.topUsersLastWeek[0]?.username || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.topUsersLastWeek[0]?.count || 0} actions
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Logs</CardTitle>
            <CardDescription>Search by username, action, TOTP account, or date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* First Row: Username, Action, Resource */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Username..."
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>

                <div className="relative flex-1">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Action (e.g., totp_viewed)..."
                    value={searchAction}
                    onChange={(e) => setSearchAction(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>

                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="TOTP Account (e.g., account_5)..."
                    value={searchResource}
                    onChange={(e) => setSearchResource(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Second Row: Date Range and Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="Start Date..."
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="End Date..."
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Button onClick={handleSearch} className="sm:w-auto">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>

                {(searchUsername || searchAction || searchResource || startDate || endDate) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchUsername("")
                      setSearchAction("")
                      setSearchResource("")
                      setStartDate("")
                      setEndDate("")
                      setOffset(0)
                      setTimeout(loadAuditLogs, 100)
                    }}
                    className="sm:w-auto"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {(searchUsername || searchAction || searchResource || startDate || endDate) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchUsername && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                      User: {searchUsername}
                    </span>
                  )}
                  {searchAction && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                      Action: {searchAction}
                    </span>
                  )}
                  {searchResource && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                      Account: {searchResource}
                    </span>
                  )}
                  {startDate && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                      From: {startDate}
                    </span>
                  )}
                  {endDate && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                      To: {endDate}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              {logs.length} logs {searchUsername || searchAction ? "(filtered)" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No audit logs found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-sm font-medium">{log.username}</span>
                      </div>

                      {log.resource && (
                        <p className="text-sm text-muted-foreground mb-1">
                          Resource: {log.resource}
                        </p>
                      )}

                      {log.details && (
                        <p className="text-sm text-muted-foreground break-all">
                          {log.details}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span>IP: {log.ip_address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {logs.length === limit && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOffset(Math.max(0, offset - limit))
                    setTimeout(loadAuditLogs, 100)
                  }}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOffset(offset + limit)
                    setTimeout(loadAuditLogs, 100)
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
