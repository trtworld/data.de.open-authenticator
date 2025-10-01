import { Account, User } from "@/types"

export interface DbUser {
  id: number
  username: string
  role: string
  created_by?: string
  created_at: number
  updated_at: number
  last_login?: number
  is_active: number
}

class APIClient {
  private baseURL = ""

  async login(username: string, password: string): Promise<User> {
    const res = await fetch(`${this.baseURL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Login failed")
    }

    const data = await res.json()
    return data.user
  }

  async logout(): Promise<void> {
    await fetch(`${this.baseURL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
  }

  async getMe(): Promise<User | null> {
    const res = await fetch(`${this.baseURL}/api/auth/me`, {
      credentials: "include",
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.user
  }

  async getAccounts(): Promise<Account[]> {
    const res = await fetch(`${this.baseURL}/api/accounts`, {
      credentials: "include",
    })

    if (!res.ok) {
      throw new Error("Failed to fetch accounts")
    }

    const data = await res.json()
    return data.accounts
  }

  async addAccount(account: {
    label: string
    secret: string
    issuer?: string
    algorithm?: string
    digits?: number
    period?: number
  }): Promise<Account> {
    const res = await fetch(`${this.baseURL}/api/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
      credentials: "include",
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Failed to add account")
    }

    const data = await res.json()
    return data.account
  }

  async deleteAccount(id: number): Promise<void> {
    const res = await fetch(`${this.baseURL}/api/accounts/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!res.ok) {
      throw new Error("Failed to delete account")
    }
  }

  // User management (admin only)
  async getUsers(): Promise<DbUser[]> {
    const res = await fetch(`${this.baseURL}/api/users`, {
      credentials: "include",
    })

    if (!res.ok) {
      throw new Error("Failed to fetch users")
    }

    const data = await res.json()
    return data.users
  }

  async createUser(username: string, password: string, role: string): Promise<DbUser> {
    const res = await fetch(`${this.baseURL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
      credentials: "include",
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Failed to create user")
    }

    const data = await res.json()
    return data.user
  }

  async deleteUser(id: number): Promise<void> {
    const res = await fetch(`${this.baseURL}/api/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Failed to delete user")
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(`${this.baseURL}/api/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
      credentials: "include",
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Failed to change password")
    }
  }

  async downloadBackup(): Promise<Blob> {
    const res = await fetch(`${this.baseURL}/api/backup`, {
      credentials: "include",
    })

    if (!res.ok) {
      throw new Error("Failed to download backup")
    }

    return await res.blob()
  }
}

export const apiClient = new APIClient()
