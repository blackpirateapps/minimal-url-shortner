// /api/_handlers.js
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7);

// --- Handler to get detailed click data for a single link ---
export async function handleGetLinkDetails(req, res, db) {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: "Slug is required." });
  }
  const clicksResult = await db.execute({
    sql: "SELECT ip_address, user_agent, referrer, clicked_at FROM clicks WHERE link_slug = ? ORDER BY clicked_at DESC",
    args: [slug]
  });
  return res.status(200).json(clicksResult.rows);
}

// --- UPDATED: Handler for fetching all links ---
export async function handleGetLinks(req, res, db) {
  // Now also fetches the hostname and click_count
  const linksResult = await db.execute("SELECT slug, url, created_at, click_count, hostname FROM links ORDER BY created_at DESC");
  return res.status(200).json(linksResult.rows);
}

// --- Domain Handlers ---
export async function handleGetDomains(req, res, db) {
  const domainsResult = await db.execute("SELECT hostname, added_at FROM domains ORDER BY added_at ASC");
  return res.status(200).json(domainsResult.rows);
}
export async function handleDeleteDomain(req, res, db, bodyData) {
  const { hostname } = bodyData;
  if (!hostname) return res.status(400).json({ error: "Hostname is required." });
  const countResult = await db.execute("SELECT COUNT(*) as count FROM domains");
  if (countResult.rows[0].count <= 1) return res.status(400).json({ error: "Cannot delete the last domain." });
  await db.execute({ sql: "DELETE FROM domains WHERE hostname = ?", args: [hostname] });
  return res.status(200).json({ message: `Domain "${hostname}" deleted successfully.` });
}
export async function handleAddDomain(req, res, db, bodyData) {
  const { hostname } = bodyData;
  if (!hostname) return res.status(400).json({ error: "Invalid hostname provided." });
  const existing = await db.execute({ sql: "SELECT hostname FROM domains WHERE hostname = ?", args: [hostname] });
  if (existing.rows.length > 0) return res.status(409).json({ error: `Domain "${hostname}" already exists.` });
  await db.execute({ sql: "INSERT INTO domains (hostname) VALUES (?)", args: [hostname] });
  return res.status(201).json({ message: "Domain added successfully." });
}

// --- UPDATED: Handler for creating a short URL ---
export async function handleShortenUrl(req, res, db, bodyData) {
  const { url: longUrl, slug: customSlug, hostname } = bodyData;
  if (!longUrl || !hostname) return res.status(400).json({ error: "Destination URL and a domain are required." });
  
  let slug;
  if (customSlug) {
    const existing = await db.execute({ sql: "SELECT slug FROM links WHERE slug = ?", args: [customSlug] });
    if (existing.rows.length > 0) return res.status(409).json({ error: `Slug "${customSlug}" is already in use.` });
    slug = customSlug;
  } else {
    let existing;
    do {
      slug = nanoid();
      existing = await db.execute({ sql: "SELECT slug FROM links WHERE slug = ?", args: [slug] });
    } while (existing.rows.length > 0);
  }
  
  // Now saves the hostname along with the slug and URL
  await db.execute({ 
    sql: "INSERT INTO links (slug, url, hostname) VALUES (?, ?, ?)", 
    args: [slug, longUrl, hostname] 
  });
  
  const shortUrl = `https://${hostname}/${slug}`;
  return res.status(200).json({ shortUrl });
}
