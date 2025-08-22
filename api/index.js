// /api/index.js

import { createClient } from "@libsql/client";
import { customAlphabet } from "nanoid";

// --- Configuration ---
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

// --- Slug Generation ---
const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  7
);

// --- Cached Database Client ---
// We will initialize this on the first request to ensure errors are caught.
let db = null;

// --- Main Handler for Vercel Serverless Function ---
export default async function handler(req, res) {
  // Add a log at the absolute beginning of the handler. If you don't see this,
  // the issue is with Vercel's routing or configuration, not the code itself.
  console.log(`[INFO] Handler invoked for method=${req.method} path=${req.url}`);

  // --- Lazy DB Initialization ---
  // This block runs only once for a "warm" function instance.
  if (!db) {
    console.log("[INFO] Database client is not initialized. Attempting to connect...");
    if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
      console.error("[FATAL] Missing Turso environment variables. Cannot initialize database client.");
      return res.status(500).json({ error: "Server configuration error. Check logs." });
    }
    try {
      db = createClient({
        url: TURSO_DATABASE_URL,
        authToken: TURSO_AUTH_TOKEN,
      });
      console.log("[INFO] Database client initialized successfully.");
    } catch (e) {
      console.error("[FATAL] Failed to create Turso client during initialization.", e);
      return res.status(500).json({ error: "Could not connect to the database. Check logs." });
    }
  }

  const { method, url } = req;
  const path = url.split("?")[0];

  try {
    // --- Body Parsing ---
    let bodyData = {};
    if (req.body) {
      try {
        bodyData = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
      } catch (e) {
        console.warn("[WARN] Invalid JSON in request body:", req.body);
        return res.status(400).json({ error: "Invalid JSON in request body." });
      }
    }

    // --- API Route: Add a new custom domain ---
    if (path === "/api/add-domain" && method === "POST") {
      const { hostname } = bodyData;
      if (!hostname || typeof hostname !== "string") {
        return res.status(400).json({ error: "Invalid hostname provided." });
      }
      await db.execute({
        sql: "INSERT INTO domains (hostname) VALUES (?) ON CONFLICT(hostname) DO NOTHING",
        args: [hostname],
      });
      console.log(`[INFO] Added domain: ${hostname}`);
      return res.status(201).json({ message: "Domain added successfully." });
    }

    // --- API Route: Create a new short link ---
    if (path === "/api/shorten" && method === "POST") {
      const { url: longUrl } = bodyData;
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
      console.log(`[INFO] Shortened ${longUrl} to ${shortUrl}`);
      return res.status(200).json({ shortUrl });
    }

    // --- Redirect Logic: Handle all other GET requests as potential slugs ---
    const slug = path.substring(1);
    if (slug && slug !== 'api' && slug !== 'favicon.ico') {
      console.log(`[INFO] Attempting redirect for slug: ${slug}`);
      const result = await db.execute({ sql: "SELECT url FROM links WHERE slug = ?", args: [slug] });
      if (result.rows.length > 0) {
        const longUrl = result.rows[0].url;
        console.log(`[INFO] Redirecting ${slug} to ${longUrl}`);
        return res.redirect(308, longUrl);
      }
    }

    // --- Fallback for any other requests ---
    console.log(`[WARN] No route matched for path: ${path}. Returning 404.`);
    return res.status(404).json({ error: "Not Found" });

  } catch (error) {
    console.error("[FATAL] An unhandled error occurred within the handler:", error);
    return res.status(500).json({ error: "Internal Server Error. Check logs." });
  }
}
