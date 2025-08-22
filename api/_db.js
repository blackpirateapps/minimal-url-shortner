// /api/_db.js

import { createClient } from "@libsql/client";

// --- Configuration ---
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let db = null;

// --- Initialization Logic ---
// This function attempts to create and return a database client.
function initializeDb() {
  if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    console.error("[FATAL] Missing Turso environment variables. Cannot initialize database client.");
    // Return null to indicate failure, which the main handler will check for.
    return null;
  }

  try {
    const client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
    console.log("[INFO] Database client initialized successfully.");
    return client;
  } catch (e) {
    console.error("[FATAL] Failed to create Turso client during initialization.", e);
    return null;
  }
}

// --- Exported Client ---
// We call the initialization function immediately. If it fails, `db` will be null.
db = initializeDb();

export default db;
