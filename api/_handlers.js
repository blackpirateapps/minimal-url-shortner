// /api/_handlers.js

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7);

// --- NEW: Handler for fetching all domains ---
export async function handleGetDomains(req, res, db) {
  const domainsResult = await db.execute("SELECT hostname, added_at FROM domains ORDER BY added_at ASC");
  return res.status(200).json(domainsResult.rows);
}

// --- NEW: Handler for deleting a domain ---
export async function handleDeleteDomain(req, res, db, bodyData) {
  const { hostname } = bodyData;
  if (!hostname) {
    return res.status(400).json({ error: "Hostname is required." });
  }
  // Optional: Check if it's the last domain before deleting
  const countResult = await db.execute("SELECT COUNT(*) as count FROM domains");
  if (countResult.rows[0].count <= 1) {
    return res.status(400).json({ error: "Cannot delete the last domain." });
  }
  await db.execute({ sql: "DELETE FROM domains WHERE hostname = ?", args: [hostname] });
  console.log(`[INFO] Deleted domain: ${hostname}`);
  return res.status(200).json({ message: `Domain "${hostname}" deleted successfully.` });
}

// --- UPDATED: Handler for adding a new domain ---
export async function handleAddDomain(req, res, db, bodyData) {
  const { hostname } = bodyData;
  if (!hostname || typeof hostname !== "string") {
    return res.status(400).json({ error: "Invalid hostname provided." });
  }
  // Check for duplicates first
  const existing = await db.execute({ sql: "SELECT hostname FROM domains WHERE hostname = ?", args: [hostname] });
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: `Domain "${hostname}" already exists.` });
  }
  await db.execute({ sql: "INSERT INTO domains (hostname) VALUES (?)", args: [hostname] });
  console.log(`[INFO] Added domain: ${hostname}`);
  return res.status(201).json({ message: "Domain added successfully." });
}

// --- Handler for fetching all links ---
export async function handleGetLinks(req, res, db) {
  const linksResult = await db.execute("SELECT slug, url, created_at FROM links ORDER BY created_at DESC");
  return res.status(200).json(linksResult.rows);
}

// --- UPDATED: Handler for creating a short URL ---
export async function handleShortenUrl(req, res, db, bodyData) {
  const { url: longUrl, slug: customSlug, hostname } = bodyData;
  
  if (!longUrl || !hostname) {
    return res.status(400).json({ error: "Destination URL and a domain are required." });
  }
  if (typeof longUrl !== "string" || !longUrl.startsWith('http')) {
    return res.status(400).json({ error: "A valid destination URL is required." });
  }

  let slug;
  if (customSlug) {
    const existing = await db.execute({ sql: "SELECT slug FROM links WHERE slug = ?", args: [customSlug] });
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Slug "${customSlug}" is already in use.` });
    }
    slug = customSlug;
  } else {
    let existing;
    do {
      slug = nanoid();
      existing = await db.execute({ sql: "SELECT slug FROM links WHERE slug = ?", args: [slug] });
    } while (existing.rows.length > 0);
  }
  
  await db.execute({ sql: "INSERT INTO links (slug, url) VALUES (?, ?)", args: [slug, longUrl] });
  
  const shortUrl = `https://${hostname}/${slug}`;
  
  console.log(`[INFO] Shortened ${longUrl} to ${shortUrl}`);
  return res.status(200).json({ shortUrl });
}
