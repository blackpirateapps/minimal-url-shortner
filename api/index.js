// /api/index.js

import { createClient } from "@libsql/client";
import { customAlphabet } from "nanoid";

// --- Configuration ---
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

// --- DB Client Initialization ---
let db;
if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error("FATAL: Turso database URL or Auth Token is not set in environment variables.");
} else {
  try {
    db = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
  } catch (e) {
    console.error("FATAL: Failed to create Turso client.", e);
  }
}

// --- Slug Generation ---
const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  7
);

// --- Main Handler for Vercel Serverless Function ---
export default async function handler(req, res) {
  if (!db) {
    console.error("Handler invoked, but DB client is not initialized.");
    return res.status(500).json({ error: "Internal Server Configuration Error." });
  }

  const { method, url } = req;
  const path = url.split("?")[0];

  // --- START: Patched Logic ---
  // Manually parse the request body if it's JSON
  let bodyData = {};
  // Vercel populates req.body with the raw string/buffer, so we need to parse it.
  if (req.body && req.headers["content-type"]?.includes("application/json")) {
    try {
      // If req.body is already an object (local dev environment), use it. Otherwise, parse.
      bodyData = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
    } catch (e) {
      console.error("Invalid JSON body:", req.body);
      return res.status(400).json({ error: "Invalid JSON in request body." });
    }
  }
  // --- END: Patched Logic ---

  try {
    // --- API Route: Add a new custom domain ---
    if (path === "/api/add-domain" && method === "POST") {
      const { hostname } = bodyData; // Use bodyData
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
      const { url: longUrl } = bodyData; // Use bodyData
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
