import { Account } from "@/types"

export const mockAccounts: Account[] = [
  {
    id: 1,
    label: "Gmail - Work",
    issuer: "Google",
    code: "123456",
    timeRemaining: 15,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  },
  {
    id: 2,
    label: "GitHub",
    issuer: "GitHub",
    code: "789012",
    timeRemaining: 15,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  },
  {
    id: 3,
    label: "AWS Production",
    issuer: "Amazon",
    code: "345678",
    timeRemaining: 15,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  },
  {
    id: 4,
    label: "Slack Workspace",
    issuer: "Slack",
    code: "901234",
    timeRemaining: 15,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  },
]

// Mock function to generate random 6-digit code
export function generateMockCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Mock function to calculate time remaining (simulates 30s cycle)
export function getMockTimeRemaining(): number {
  const now = Math.floor(Date.now() / 1000)
  return 30 - (now % 30)
}
