"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient, DbUser } from "@/lib/api-client"
import { Trash2, UserPlus, Shield, Eye, Users } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BulkUserCreateDialog } from "./bulk-user-create-dialog"

interface UserManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserManagementDialog({ open, onOpenChange }: UserManagementDialogProps) {
  const [users, setUsers] = useState<DbUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false)
  const [error, setError] = useState("")

  // Create user form state
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "user">("user")

  // Load users when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const usersList = await apiClient.getUsers()
      setUsers(usersList)
    } catch (error: any) {
      setError(error.message || "Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!newUsername || !newPassword || !newRole) {
      setError("All fields are required")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    try {
      setIsLoading(true)
      await apiClient.createUser(newUsername, newPassword, newRole)
      setNewUsername("")
      setNewPassword("")
      setNewRole("user")
      setShowCreateForm(false)
      await loadUsers()
      alert("✅ User created successfully!")
    } catch (error: any) {
      setError(error.message || "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return
    }

    try {
      setIsLoading(true)
      await apiClient.deleteUser(userId)
      await loadUsers()
      alert("✅ User deleted successfully!")
    } catch (error: any) {
      alert(error.message || "Failed to delete user")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-red-500" />
      default:
        return <UserPlus className="w-4 h-4 text-green-500" />
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
          <DialogDescription>
            Create, view, and delete users. Only admins can access this panel.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* Create User Buttons */}
        {!showCreateForm && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full"
              disabled={isLoading}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Single User
            </Button>
            <Button
              onClick={() => setShowBulkCreateDialog(true)}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <Users className="w-4 h-4 mr-2" />
              Bulk Create Users
            </Button>
          </div>
        )}

        {/* Create User Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateUser} className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="space-y-2">
              <label htmlFor="new-username" className="text-sm font-medium">
                Username *
              </label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                Password *
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-role" className="text-sm font-medium">
                Role *
              </label>
              <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Can create private accounts)</SelectItem>
                  <SelectItem value="admin">Admin (Can create team accounts)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewUsername("")
                  setNewPassword("")
                  setNewRole("user")
                  setError("")
                }}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        )}

        {/* Users List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            All Users ({users.length})
          </h3>
          
          {isLoading && users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.username}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {user.role}
                        </span>
                        {!user.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            inactive
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span>Created: {formatDate(user.created_at)}</span>
                        {user.last_login && (
                          <span>Last login: {formatDate(user.last_login)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {user.username !== "admin" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
            disabled={isLoading}
          >
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Bulk User Create Dialog */}
      <BulkUserCreateDialog
        open={showBulkCreateDialog}
        onOpenChange={setShowBulkCreateDialog}
        onSuccess={loadUsers}
      />
    </Dialog>
  )
}
