"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Copy, Check, Terminal, Code2, BookOpen } from "lucide-react"

export default function ApiDocsPage() {
  const router = useRouter()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const CodeBlock = ({ code, language = "bash", id }: { code: string; language?: string; id: string }) => (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code className="language-{language}">{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-100"
        onClick={() => handleCopy(code, id)}
      >
        {copiedCode === id ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  )

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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8" />
              API Documentation
            </h1>
            <p className="text-muted-foreground mt-1">
              Programmatic access to TOTP codes and account management
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Quick Start
            </CardTitle>
            <CardDescription>Get started with Otto-TP API in 3 steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-semibold">1. Create API Key</p>
              <p className="text-sm text-muted-foreground">
                Go to <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/api-keys")}>API Keys</Button> page and create a new key
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">2. Find Your Account Code</p>
              <p className="text-sm text-muted-foreground">
                Format: <code className="bg-muted px-2 py-1 rounded">issuer:label</code> (e.g., <code className="bg-muted px-2 py-1 rounded">google:user@example.com</code>)
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">3. Make Your First Request</p>
              <CodeBlock
                id="quickstart"
                code={`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "http://localhost:3000/api/v1/totp/generate?account_code=google:user@example.com"`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>All API requests require Bearer token authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Header Format:</p>
              <CodeBlock
                id="auth-header"
                code={`Authorization: Bearer otto_your_api_key_here`}
              />
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                🔑 Admin Only
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Only users with <strong>admin</strong> role can create and use API keys
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              API Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="generate" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="generate">Generate TOTP</TabsTrigger>
                <TabsTrigger value="export">Export Accounts</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </TabsList>

              {/* Generate TOTP */}
              <TabsContent value="generate" className="space-y-6 mt-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm font-semibold">
                      GET
                    </span>
                    <code className="text-sm">/api/v1/totp/generate</code>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Generate TOTP code for a specific account
                  </p>
                </div>

                {/* Query Parameters */}
                <div>
                  <h4 className="font-semibold mb-3">Query Parameters (one required):</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-sm">account_id <span className="text-muted-foreground">(number)</span></p>
                      <p className="text-sm text-muted-foreground mt-1">
                        The numeric ID of the account from database
                      </p>
                      <code className="text-xs bg-background px-2 py-1 rounded mt-2 inline-block">
                        ?account_id=15
                      </code>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-sm">account_code <span className="text-muted-foreground">(string)</span></p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Format: <code className="bg-background px-1 rounded">issuer:label</code> or just <code className="bg-background px-1 rounded">label</code>
                      </p>
                      <div className="space-y-1 mt-2">
                        <code className="text-xs bg-background px-2 py-1 rounded block">
                          ?account_code=google:user@example.com
                        </code>
                        <code className="text-xs bg-background px-2 py-1 rounded block">
                          ?account_code=GitHub:myusername
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h4 className="font-semibold mb-3">Example Requests:</h4>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Using Account ID:</p>
                      <CodeBlock
                        id="gen-id"
                        code={`curl -H "Authorization: Bearer otto_your_api_key" \\
  "http://localhost:3000/api/v1/totp/generate?account_id=15"`}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Using Account Code (with issuer):</p>
                      <CodeBlock
                        id="gen-code1"
                        code={`curl -H "Authorization: Bearer otto_your_api_key" \\
  "http://localhost:3000/api/v1/totp/generate?account_code=google:user@example.com"`}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Using Account Code (label only):</p>
                      <CodeBlock
                        id="gen-code2"
                        code={`curl -H "Authorization: Bearer otto_your_api_key" \\
  "http://localhost:3000/api/v1/totp/generate?account_code=My%20Account"`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Note: URL encode spaces as %20
                      </p>
                    </div>
                  </div>
                </div>

                {/* Response */}
                <div>
                  <h4 className="font-semibold mb-3">Response:</h4>
                  <CodeBlock
                    id="gen-response"
                    language="json"
                    code={`{
  "code": "123456",
  "timeRemaining": 25,
  "account": {
    "id": 15,
    "label": "user@example.com",
    "issuer": "Google"
  }
}`}
                  />
                </div>

                {/* Common Errors */}
                <div>
                  <h4 className="font-semibold mb-3">Common Errors:</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="font-medium text-sm text-red-900 dark:text-red-100">
                        "Either account_id or account_code is required"
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        You must provide at least one query parameter
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="font-medium text-sm text-red-900 dark:text-red-100">
                        "Account not found"
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Check your account code format or ID. Make sure the account exists.
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="font-medium text-sm text-red-900 dark:text-red-100">
                        "Access denied: You don't have permission"
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        You can only access team accounts or your own private accounts
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Export Accounts */}
              <TabsContent value="export" className="space-y-6 mt-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm font-semibold">
                      GET
                    </span>
                    <code className="text-sm">/api/v1/accounts/export</code>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Export accounts in various formats
                  </p>
                </div>

                {/* Query Parameters */}
                <div>
                  <h4 className="font-semibold mb-3">Query Parameters:</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-sm">format <span className="text-muted-foreground">(string, optional)</span></p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Output format: <code className="bg-background px-1 rounded">json</code>, <code className="bg-background px-1 rounded">csv</code>, <code className="bg-background px-1 rounded">otpauth</code> (default: json)
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-sm">filter <span className="text-muted-foreground">(string, optional)</span></p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Filter: <code className="bg-background px-1 rounded">team</code>, <code className="bg-background px-1 rounded">private</code>, <code className="bg-background px-1 rounded">all</code> (default: all)
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-sm">include_secrets <span className="text-muted-foreground">(boolean, optional)</span></p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Include decrypted secrets (JSON/CSV only): <code className="bg-background px-1 rounded">true</code> or <code className="bg-background px-1 rounded">false</code> (default: false)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h4 className="font-semibold mb-3">Example Requests:</h4>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Export as JSON (without secrets):</p>
                      <CodeBlock
                        id="export-json"
                        code={`curl -H "Authorization: Bearer otto_your_api_key" \\
  "http://localhost:3000/api/v1/accounts/export?format=json"`}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Export as CSV with secrets:</p>
                      <CodeBlock
                        id="export-csv"
                        code={`curl -H "Authorization: Bearer otto_your_api_key" \\
  "http://localhost:3000/api/v1/accounts/export?format=csv&include_secrets=true" \\
  -o accounts.csv`}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Export OTPAuth URLs:</p>
                      <CodeBlock
                        id="export-otpauth"
                        code={`curl -H "Authorization: Bearer otto_your_api_key" \\
  "http://localhost:3000/api/v1/accounts/export?format=otpauth&filter=team"`}
                      />
                    </div>
                  </div>
                </div>

                {/* Response */}
                <div>
                  <h4 className="font-semibold mb-3">JSON Response Example:</h4>
                  <CodeBlock
                    id="export-response"
                    language="json"
                    code={`{
  "accounts": [
    {
      "id": 1,
      "label": "user@example.com",
      "issuer": "Google",
      "algorithm": "SHA1",
      "digits": 6,
      "period": 30,
      "visibility": "team",
      "created_by": "admin"
    }
  ],
  "exported_at": "2025-10-02T12:00:00.000Z",
  "total": 1,
  "format": "json",
  "filter": "all"
}`}
                  />
                </div>
              </TabsContent>

              {/* Favorites */}
              <TabsContent value="favorites" className="space-y-6 mt-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    🔐 Web Session Authentication
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Favorites endpoints use web session authentication (cookies), not API keys. These are designed for web interface integration.
                  </p>
                </div>

                {/* Add Favorite */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm font-semibold">
                      POST
                    </span>
                    <code className="text-sm">/api/accounts/[id]/favorite</code>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Add an account to your favorites list
                  </p>
                </div>

                {/* Parameters */}
                <div>
                  <h4 className="font-semibold mb-3">Path Parameters:</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm">id <span className="text-muted-foreground">(number, required)</span></p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The numeric ID of the account to favorite
                    </p>
                  </div>
                </div>

                {/* Add Example */}
                <div>
                  <h4 className="font-semibold mb-3">Example Request:</h4>
                  <CodeBlock
                    id="fav-add"
                    code={`curl -X POST \\
  -H "Content-Type: application/json" \\
  -H "Cookie: auth-token=your_session_token" \\
  "http://localhost:3000/api/accounts/15/favorite"`}
                  />
                </div>

                {/* Add Response */}
                <div>
                  <h4 className="font-semibold mb-3">Success Response:</h4>
                  <CodeBlock
                    id="fav-add-response"
                    language="json"
                    code={`{
  "success": true,
  "is_favorite": true
}`}
                  />
                </div>

                {/* Remove Favorite */}
                <div className="pt-6 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-sm font-semibold">
                      DELETE
                    </span>
                    <code className="text-sm">/api/accounts/[id]/favorite</code>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Remove an account from your favorites list
                  </p>
                </div>

                {/* Remove Example */}
                <div>
                  <h4 className="font-semibold mb-3">Example Request:</h4>
                  <CodeBlock
                    id="fav-remove"
                    code={`curl -X DELETE \\
  -H "Cookie: auth-token=your_session_token" \\
  "http://localhost:3000/api/accounts/15/favorite"`}
                  />
                </div>

                {/* Remove Response */}
                <div>
                  <h4 className="font-semibold mb-3">Success Response:</h4>
                  <CodeBlock
                    id="fav-remove-response"
                    language="json"
                    code={`{
  "success": true,
  "is_favorite": false
}`}
                  />
                </div>

                {/* Common Errors */}
                <div>
                  <h4 className="font-semibold mb-3">Common Errors:</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="font-medium text-sm text-red-900 dark:text-red-100">
                        401 Unauthorized
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        You must be logged in to manage favorites
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="font-medium text-sm text-red-900 dark:text-red-100">
                        404 Account not found
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        The account doesn't exist or you don't have access to it
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="font-medium text-sm text-red-900 dark:text-red-100">
                        400 Invalid account ID
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        The account ID must be a valid number
                      </p>
                    </div>
                  </div>
                </div>

                {/* Integration Note */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                    💡 Integration Tips
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                    <li>Favorites are user-specific and persist across sessions</li>
                    <li>Adding an already favorited account is idempotent (no error)</li>
                    <li>You can only favorite accounts you have access to (team or your private accounts)</li>
                    <li>Use the web interface to see your favorited accounts with star indicators</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* How to Find Account Code */}
        <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle>📋 How to Find Your Account Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-semibold">Method 1: From Dashboard</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to Dashboard and view your accounts</li>
                <li>Look at the account card: the <strong>title</strong> is the <code className="bg-background px-1 rounded">label</code></li>
                <li>The small text below is the <code className="bg-background px-1 rounded">issuer</code></li>
                <li>Format: <code className="bg-background px-1 rounded">issuer:label</code></li>
              </ol>
              <div className="p-3 bg-background rounded border mt-2">
                <p className="text-xs text-muted-foreground mb-1">Example from Dashboard:</p>
                <div className="space-y-1">
                  <p className="font-bold">user@example.com</p>
                  <p className="text-sm text-muted-foreground">Google</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  → Account Code: <code className="bg-muted px-2 py-1 rounded">google:user@example.com</code>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Method 2: Export and Check</p>
              <CodeBlock
                id="find-code"
                code={`# List all accounts to find IDs and codes
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "http://localhost:3000/api/v1/accounts/export?format=json"`}
              />
            </div>

            <div className="p-4 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <p className="text-sm font-medium mb-1">⚠️ Important:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Account codes are <strong>case-sensitive</strong></li>
                <li>URL encode special characters (spaces = %20)</li>
                <li>If account_code doesn't work, try using account_id instead</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Common Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">1. ETL Process with 2FA</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Automate login to services requiring 2FA in your data pipelines
              </p>
              <CodeBlock
                id="usecase-etl"
                language="python"
                code={`import requests

API_KEY = "otto_your_api_key"
BASE_URL = "http://localhost:3000"

def get_totp(account_code):
    response = requests.get(
        f"{BASE_URL}/api/v1/totp/generate",
        params={"account_code": account_code},
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    return response.json()["code"]

# Use in ETL
totp = get_totp("salesforce:etl@company.com")
salesforce.login(username, password, totp)`}
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. CI/CD Pipeline</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Integrate TOTP in GitHub Actions or other CI/CD tools
              </p>
              <CodeBlock
                id="usecase-cicd"
                language="yaml"
                code={`# .github/workflows/deploy.yml
- name: Get TOTP
  run: |
    TOTP=$(curl -H "Authorization: Bearer \${{ secrets.API_KEY }}" \\
      "\${{ secrets.OTTO_URL }}/api/v1/totp/generate?account_code=aws:deploy")
    echo "TOTP_CODE=$(echo $TOTP | jq -r '.code')" >> $GITHUB_ENV

- name: Deploy
  run: aws-deploy --totp \${{ env.TOTP_CODE }}`}
              />
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Backup & Migration</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Export all accounts for backup or migration
              </p>
              <CodeBlock
                id="usecase-backup"
                language="bash"
                code={`#!/bin/bash
# Backup all accounts with secrets
curl -H "Authorization: Bearer $API_KEY" \\
  "http://localhost:3000/api/v1/accounts/export?format=json&include_secrets=true" \\
  -o backup-$(date +%Y%m%d).json`}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
