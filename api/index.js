// /api/index.js

import { createClient } from "@libsql/client";
import { customAlphabet } from "nanoid";

// --- Configuration ---
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

// --- DB Client Initialization ---
let db;

// This is the new, safer initialization block.
// It checks for the environment variables before trying to create the database client.
if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error("FATAL: Turso database URL or Auth Token is not set in environment variables.");
  // db remains uninitialized
} else {
  try {
    db = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
  } catch (e) {
    console.error("FATAL: Failed to create Turso client.", e);
    // db remains uninitialized
  }
}

// --- Slug Generation ---
const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  7
);

// --- Main Handler for Vercel Serverless Function ---
export default async function handler(req, res) {
  // This new check at the top of the handler provides a clear error response
  // if the database connection failed to initialize.
  if (!db) {
    console.error("Handler invoked, but DB client is not initialized. Check startup logs for FATAL errors.");
    return res.status(500).json({ error: "Internal Server Configuration Error. Administrator has been notified." });
  }

  const { method, url, body } = req;
  const path = url.split("?")[0];

  try {
    // --- API Route: Add a new custom domain ---
    if (path === "/api/add-domain" && method === "POST") {
      const { hostname } = body;
      if (!hostname || typeof hostname !== "string") {
        return res.status(400).json({ error: "Invalid hostname provided." });
      }
      await db.execute({
        sql: "INSERT INTO domains (hostname) VALUES (?) ON CONFLICT(hostname) DO NOTHING",
        args: [hostname],
      });
      return res.status(201).json({ message: "Domain added successfully." });
    }

    // --- API Route: Create a new short link ---
    if (path === "/api/shorten" && method === "POST") {
      const { url: longUrl } = body;
      if (!longUrl || typeof longUrl !== "string" || !longUrl.startsWith('http')) {
        return res.status(400).json({ error: "A valid URL starting with http or https is required." });
      }
      let slug = nanoid();
      let existing;
      do {
        slug = nanoid();
        existing = await db.execute({ sql: "SELECT slug FROM links WHERE slug = ?", args: [slug] });
      } while (existing.rows.length > 0);
      await db.execute({ sql: "INSERT INTO links (slug, url) VALUES (?, ?)", args: [slug, longUrl] });
      const domainsResult = await db.execute("SELECT hostname FROM domains ORDER BY added_at ASC LIMIT 1");
      const primaryDomain = domainsResult.rows.length > 0 ? domainsResult.rows[0].hostname : req.headers.host;
      const shortUrl = `https://${primaryDomain}/${slug}`;
      return res.status(200).json({ shortUrl });
    }

    // --- Redirect Logic: Handle all other GET requests as potential slugs ---
    const slug = path.substring(1);
    if (slug && slug !== 'favicon.ico') {
      const result = await db.execute({ sql: "SELECT url FROM links WHERE slug = ?", args: [slug] });
      if (result.rows.length > 0) {
        const longUrl = result.rows[0].url;
        return res.redirect(308, longUrl);
      }
    }

    // --- Fallback for any other requests ---
    return res.status(404).json({ error: "Not Found" });

  } catch (error) {
    console.error("An error occurred within the handler:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
}
```

### **What to do next:**

1.  **Update the Code:** Replace the code in `api/index.js` with the version above.
2.  **Double-Check Variables:** Please go back to your Vercel project **Settings -> Environment Variables** one more time and confirm `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are there, correctly spelled, and have the correct values.
3.  **Redeploy:** Commit the code change and let Vercel create a new deployment.
4.  **Check Logs Again:** Go to the logs for the new deployment. If the environment variables are still the problem, you will now see a very clear error message: **"FATAL: Turso database URL or Auth Token is not set..."**. This will confirm the root cau