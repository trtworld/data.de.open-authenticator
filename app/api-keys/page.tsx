"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { User } from "@/types"
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  BookOpen,
} from "lucide-react"

interface ApiKey {
  id: number
  api_key: string
  name: string
  created_at: number
  last_used_at: number | null
  expires_at: number | null
  is_active: number
}

export default function ApiKeysPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [expiresInDays, setExpiresInDays] = useState<number | "">(30)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set())
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)

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

        const response = await fetch("/api/api-keys", {
          credentials: "include",
        })
        const data = await response.json()
        setApiKeys(data.apiKeys || [])
      } catch (error) {
        console.error("Failed to load API keys:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newKeyName.trim()) {
      alert("Please enter a name for the API key")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newKeyName,
          expires_in_days: expiresInDays || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create API key")
      }

      setApiKeys([data.apiKey, ...apiKeys])
      setNewlyCreatedKey(data.apiKey.api_key)
      setNewKeyName("")
      setExpiresInDays(30)

      // Auto-show the newly created key
      setVisibleKeys(new Set([data.apiKey.id]))
    } catch (error: any) {
      alert(error.message || "Failed to create API key")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteKey = async (id: number) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete API key")
      }

      setApiKeys(apiKeys.filter((key) => key.id !== id))
    } catch (error: any) {
      alert(error.message || "Failed to delete API key")
    }
  }

  const handleCopyKey = async (apiKey: string) => {
    await navigator.clipboard.writeText(apiKey)
    setCopiedKey(apiKey)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleKeyVisibility = (id: number) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleKeys(newVisible)
  }

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "Never"
    return new Date(timestamp * 1000).toLocaleString()
  }

  const isExpired = (expiresAt: number | null) => {
    if (!expiresAt) return false
    return expiresAt < Date.now() / 1000
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Key className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading API keys...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">API Keys</h1>
            <p className="text-muted-foreground mt-1">
              Manage your API keys for programmatic access
            </p>
          </div>
        </div>

        {/* Create New API Key */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>
              Generate a new API key to access Otto-TP APIs programmatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Key Name *
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g., Production Server, CI/CD Pipeline"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="expires" className="text-sm font-medium">
                    Expires In (Days)
                  </label>
                  <Input
                    id="expires"
                    type="number"
                    min="1"
                    max="365"
                    placeholder="30"
                    value={expiresInDays}
                    onChange={(e) =>
                      setExpiresInDays(e.target.value ? parseInt(e.target.value) : "")
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no expiration
                  </p>
                </div>
              </div>
              <Button type="submit" disabled={isCreating}>
                <Plus className="w-4 h-4 mr-2" />
                {isCreating ? "Creating..." : "Create API Key"}
              </Button>
            </form>

            {newlyCreatedKey && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-100 mb-2">
                      API Key Created Successfully!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      ⚠️ Make sure to copy your API key now. You won't be able to see it again!
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-white dark:bg-slate-900 rounded border text-sm font-mono break-all">
                        {newlyCreatedKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleCopyKey(newlyCreatedKey)
                          setNewlyCreatedKey(null)
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your API Keys</h2>

          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No API keys yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first API key to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{apiKey.name}</h3>
                        {isExpired(apiKey.expires_at) && (
                          <span className="px-2 py-0.5 text-xs bg-destructive/10 text-destructive rounded-full">
                            Expired
                          </span>
                        )}
                        {!apiKey.is_active && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                          {visibleKeys.has(apiKey.id)
                            ? apiKey.api_key
                            : "otto_" + "•".repeat(32)}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyKey(apiKey.api_key)}
                        >
                          {copiedKey === apiKey.api_key ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created: {formatDate(apiKey.created_at)}
                        </div>
                        {apiKey.last_used_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last used: {formatDate(apiKey.last_used_at)}
                          </div>
                        )}
                        {apiKey.expires_at && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Expires: {formatDate(apiKey.expires_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteKey(apiKey.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Documentation Link */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">📚 API Documentation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Learn how to use your API keys to access Otto-TP APIs
            </p>
            <Button
              onClick={() => router.push("/api-docs")}
              className="mb-4"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              View Full API Documentation
            </Button>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-2">
                  <strong>Quick Start - Using Account ID:</strong>
                </p>
                <code className="block p-2 bg-muted rounded text-xs">
                  curl -H "Authorization: Bearer YOUR_KEY" \<br />
                  &nbsp;&nbsp;"http://localhost:3000/api/v1/totp/generate?account_id=15"
                </code>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Hover over any account in Dashboard to see its API ID
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <strong>Or Using Account Code:</strong>
                </p>
                <code className="block p-2 bg-muted rounded text-xs">
                  curl -H "Authorization: Bearer YOUR_KEY" \<br />
                  &nbsp;&nbsp;"http://localhost:3000/api/v1/totp/generate?account_code=google:user@example.com"
                </code>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: <code className="bg-background px-1 rounded">issuer:label</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
