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
}

export interface User {
  username: string
  role: "admin" | "viewer"
}
