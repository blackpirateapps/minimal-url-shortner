// /api/_handlers.js

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7);

// --- NEW: Handler for fetching all links ---
export async function handleGetLinks(req, res, db) {
  // Fetch all links, ordering by the most recently created
  const linksResult = await db.execute("SELECT slug, url, created_at FROM links ORDER BY created_at DESC");
  return res.status(200).json(linksResult.rows);
}

// --- Handler for adding a new domain ---
export async function handleAddDomain(req, res, db, bodyData) {
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

// --- UPDATED: Handler for creating a short URL ---
export async function handleShortenUrl(req, res, db, bodyData) {
  const { url: longUrl, slug: customSlug } = bodyData; // Now accepts 'slug'
  
  if (!longUrl || typeof longUrl !== "string" || !longUrl.startsWith('http')) {
    return res.status(400).json({ error: "A valid URL starting with http or https is required." });
  }

  let slug;
  if (customSlug) {
    // If a custom slug is provided, check if it's already taken.
    const existing = await db.execute({ sql: "SELECT slug FROM links WHERE slug = ?", args: [customSlug] });
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Slug "${customSlug}" is already in use.` });
    }
    slug = customSlug;
  } else {
    // If no custom slug, generate a random one.
    let existing;
    do {
      slug = nanoid();
      existing = await db.execute({ sql: "SELECT slug FROM links WHERE slug = ?", args: [slug] });
    } while (existing.rows.length > 0);
  }
  
  await db.execute({ sql: "INSERT INTO links (slug, url) VALUES (?, ?)", args: [slug, longUrl] });
  
  const domainsResult = await db.execute("SELECT hostname FROM domains ORDER BY added_at ASC LIMIT 1");
  const primaryDomain = domainsResult.rows.length > 0 ? domainsResult.rows[0].hostname : req.headers.host;
  const shortUrl = `https://${primaryDomain}/${slug}`;
  
  console.log(`[INFO] Shortened ${longUrl} to ${shortUrl}`);
  return res.status(200).json({ shortUrl });
}

// --- Handler for redirecting a short link ---
export async function handleRedirect(req, res, db, slug) {
   console.log(`[INFO] Attempting redirect for slug: ${slug}`);
   const result = await db.execute({ sql: "SELECT url FROM links WHERE slug = ?", args: [slug] });
   if (result.rows.length > 0) {
     const longUrl = result.rows[0].url;
     console.log(`[INFO] Redirecting ${slug} to ${longUrl}`);
     return res.redirect(308, longUrl);
   }
   return null;
}
