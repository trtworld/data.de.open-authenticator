"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { apiClient } = await import("@/lib/api-client")
      await apiClient.login(username, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Invalid credentials")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <Card className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-white/20 dark:border-slate-700/50 shadow-2xl">
          <CardHeader className="space-y-4 flex flex-col items-center pb-8 pt-10">
            {/* Logo */}
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-xl ring-4 ring-primary/20 group hover:ring-primary/40 transition-all duration-300 bg-white dark:bg-slate-800">
              <Image
                src="/logo.png"
                alt="Otto-TP Logo"
                width={96}
                height={96}
                className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                priority
              />
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <CardDescription className="text-base font-medium">
                Online Team-Based TOTP Authenticator
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-semibold text-foreground/80">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-foreground/80">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive text-center animate-fade-in">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-xs text-center text-muted-foreground">
              Default: admin/actrt123admin
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400 space-y-3 animate-fade-in">
          <p>
            Developed with ❤️ as open source by{" "}
            <a
              href="https://github.com/alameddinc"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Alameddin Çelik
            </a>
          </p>
          <a
            href="https://github.com/alameddinc/open-authenticator"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="font-medium">View on GitHub</span>
          </a>
          <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center justify-center gap-1.5">
            <span className="text-base">🇵🇸</span>
            Free Palestine
          </p>
        </footer>
      </div>
    </div>
  )
}
