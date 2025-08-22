// /api/index.js

import { createClient } from "@libsql/client";
import { customAlphabet } from "nanoid";

// --- Configuration ---
// Make sure to set these environment variables in your Vercel project settings.
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

// --- Turso DB Client Initialization ---
const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// --- Slug Generation ---
// Generates a random 7-character alphanumeric slug.
const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  7
);

// --- Main Handler for Vercel Serverless Function ---
export default async function handler(req, res) {
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
      if (!longUrl || typeof longUrl !== "string") {
        return res.status(400).json({ error: "Invalid URL provided." });
      }

      // Generate a unique slug
      let slug = nanoid();
      let existing = await db.execute({
        sql: "SELECT slug FROM links WHERE slug = ?",
        args: [slug],
      });

      // Keep generating until we find a unique slug
      while (existing.rows.length > 0) {
        slug = nanoid();
        existing = await db.execute({
          sql: "SELECT slug FROM links WHERE slug = ?",
          args: [slug],
        });
      }

      // Store the new link in the database
      await db.execute({
        sql: "INSERT INTO links (slug, url) VALUES (?, ?)",
        args: [slug, longUrl],
      });

      // Fetch the primary custom domain to construct the short URL
      const domainsResult = await db.execute(
        "SELECT hostname FROM domains ORDER BY added_at ASC LIMIT 1"
      );
      const primaryDomain =
        domainsResult.rows.length > 0 ? domainsResult.rows[0].hostname : req.headers.host;

      const shortUrl = `https://${primaryDomain}/${slug}`;

      return res.status(200).json({ shortUrl });
    }

    // --- Redirect Logic: Handle short link visits ---
    const slug = path.substring(1); // Remove leading '/'
    if (slug) {
      const result = await db.execute({
        sql: "SELECT url FROM links WHERE slug = ?",
        args: [slug],
      });

      if (result.rows.length > 0) {
        const longUrl = result.rows[0].url;
        // Perform a permanent redirect
        return res.redirect(308, longUrl);
      }
    }

    // --- Fallback ---
    // If no route is matched, you can redirect to your main page or show a 404.
    // For this example, we'll just send a simple message.
    return res.status(404).send("URL not found or invalid API route.");

  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
}
