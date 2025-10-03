import Database from "better-sqlite3"
import { readFileSync } from "fs"
import { join } from "path"
import { runMigrations } from "../db-migrations"

const DB_PATH = process.env.DB_PATH || join(process.cwd(), "data", "app.db")

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const { mkdirSync, existsSync } = require("fs")
    const dataDir = join(process.cwd(), "data")
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }

    // Initialize database
    db = new Database(DB_PATH)
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")

    // Run initial schema
    const schema = readFileSync(join(process.cwd(), "lib", "db", "schema.sql"), "utf-8")
    db.exec(schema)

    // Run migrations
    runMigrations()

    console.log("✅ Database initialized at:", DB_PATH)
  }

  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

// Cleanup on process exit
if (typeof process !== "undefined") {
  process.on("beforeExit", closeDb)
  process.on("SIGINT", () => {
    closeDb()
    process.exit(0)
  })
}
