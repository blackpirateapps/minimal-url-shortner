// /api/_handlers.js

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7);

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

// --- Handler for creating a short URL ---
export async function handleShortenUrl(req, res, db, bodyData) {
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

// --- Handler for redirecting a short link ---
export async function handleRedirect(req, res, db, slug) {
   console.log(`[INFO] Attempting redirect for slug: ${slug}`);
   const result = await db.execute({ sql: "SELECT url FROM links WHERE slug = ?", args: [slug] });
   if (result.rows.length > 0) {
     const longUrl = result.rows[0].url;
     console.log(`[INFO] Redirecting ${slug} to ${longUrl}`);
     return res.redirect(308, longUrl);
   }
   // If slug not found, fall through to the main handler's 404 response
   return null;
}
