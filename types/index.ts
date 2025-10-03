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
  icon_identifier?: string | null
  category?: string | null
  is_favorite?: boolean
  view_count?: number
  copy_count?: number
}

export interface User {
  username: string
  role: "admin" | "user"
}
