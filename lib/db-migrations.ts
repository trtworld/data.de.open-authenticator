import { getDb } from "./db"

/**
 * Run database migrations
 */
export function runMigrations() {
  const db = getDb()

  // Create migrations table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at INTEGER DEFAULT (unixepoch())
    )
  `)

  // Check if migration 001 already executed
  const migration001 = db.prepare("SELECT * FROM migrations WHERE id = 1").get()

  if (!migration001) {
    console.log("Running migration 001: favorites and metadata...")

    try {
      // Create favorites table
      db.exec(`
        CREATE TABLE IF NOT EXISTS favorites (
          user_id INTEGER NOT NULL,
          account_id INTEGER NOT NULL,
          created_at INTEGER DEFAULT (unixepoch()),
          PRIMARY KEY (user_id, account_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
        )
      `)

      // Create indexes for favorites
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_account_id ON favorites(account_id);
      `)

      // Add metadata columns to accounts (SQLite way - check if column exists first)
      const tableInfo = db.prepare("PRAGMA table_info(accounts)").all() as Array<{ name: string }>
      const columnNames = tableInfo.map(col => col.name)

      if (!columnNames.includes("icon_identifier")) {
        db.exec(`ALTER TABLE accounts ADD COLUMN icon_identifier TEXT`)
      }

      if (!columnNames.includes("icon_url")) {
        db.exec(`ALTER TABLE accounts ADD COLUMN icon_url TEXT`)
      }

      if (!columnNames.includes("category")) {
        db.exec(`ALTER TABLE accounts ADD COLUMN category TEXT`)
      }

      // Create additional indexes for performance
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);
        CREATE INDEX IF NOT EXISTS idx_accounts_visibility ON accounts(visibility);
      `)

      // Record migration
      db.prepare("INSERT INTO migrations (id, name) VALUES (?, ?)").run(
        1,
        "favorites_and_metadata"
      )

      console.log("✓ Migration 001 completed successfully")
    } catch (error) {
      console.error("✗ Migration 001 failed:", error)
      throw error
    }
  } else {
    console.log("✓ Migration 001 already executed")
  }

  // Check if migration 002 already executed
  const migration002 = db.prepare("SELECT * FROM migrations WHERE id = 2").get()

  if (!migration002) {
    console.log("Running migration 002: usage tracking...")

    try {
      // Add usage tracking columns to accounts
      const tableInfo = db.prepare("PRAGMA table_info(accounts)").all() as Array<{ name: string }>
      const columnNames = tableInfo.map(col => col.name)

      if (!columnNames.includes("view_count")) {
        db.exec(`ALTER TABLE accounts ADD COLUMN view_count INTEGER DEFAULT 0`)
      }

      if (!columnNames.includes("copy_count")) {
        db.exec(`ALTER TABLE accounts ADD COLUMN copy_count INTEGER DEFAULT 0`)
      }

      // Record migration
      db.prepare("INSERT INTO migrations (id, name) VALUES (?, ?)").run(
        2,
        "usage_tracking"
      )

      console.log("✓ Migration 002 completed successfully")
    } catch (error) {
      console.error("✗ Migration 002 failed:", error)
      throw error
    }
  } else {
    console.log("✓ Migration 002 already executed")
  }
}

/**
 * Auto-detect icon identifier from issuer name
 */
export function detectIconFromIssuer(issuer: string | null): string | null {
  if (!issuer) return null

  const iconMap: Record<string, string> = {
    github: "github",
    "github.com": "github",
    google: "google",
    "google.com": "google",
    gmail: "google",
    microsoft: "microsoft",
    "microsoft.com": "microsoft",
    outlook: "microsoft",
    amazon: "amazonaws",
    "amazon.com": "amazonaws",
    aws: "amazonaws",
    "amazon web services": "amazonaws",
    facebook: "facebook",
    "facebook.com": "facebook",
    twitter: "twitter",
    "twitter.com": "twitter",
    x: "twitter",
    "x.com": "twitter",
    linkedin: "linkedin",
    "linkedin.com": "linkedin",
    dropbox: "dropbox",
    "dropbox.com": "dropbox",
    slack: "slack",
    "slack.com": "slack",
    discord: "discord",
    "discord.com": "discord",
    gitlab: "gitlab",
    "gitlab.com": "gitlab",
    bitbucket: "bitbucket",
    "bitbucket.org": "bitbucket",
    stripe: "stripe",
    "stripe.com": "stripe",
    paypal: "paypal",
    "paypal.com": "paypal",
    npm: "npm",
    "npmjs.com": "npm",
    docker: "docker",
    "docker.com": "docker",
    "docker hub": "docker",
    cloudflare: "cloudflare",
    "cloudflare.com": "cloudflare",
    digitalocean: "digitalocean",
    vercel: "vercel",
    "vercel.com": "vercel",
    netlify: "netlify",
    "netlify.com": "netlify",
    heroku: "heroku",
    "heroku.com": "heroku",
  }

  const normalized = issuer.toLowerCase().trim()
  return iconMap[normalized] || null
}
