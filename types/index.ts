export interface Account {
  id: number
  label: string
  issuer: string
  secret?: string
  code: string
  timeRemaining: number
  algorithm?: string
  digits?: number
  period?: number
  visibility?: "team" | "private"
  created_by?: string
}

export interface User {
  username: string
  role: "admin" | "viewer" | "user"
}
