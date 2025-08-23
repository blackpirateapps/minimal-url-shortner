// /api/_handlers.js
import { customAlphabet } from "nanoid";
import bcrypt from 'bcryptjs';

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7);

// --- Handler to delete a link ---
export async function handleDeleteLink(req, res, db, bodyData) {
  const { slug } = bodyData;
  if (!slug) {
    return res.status(400).json({ error: "Slug is required to delete a link." });
  }
  await db.execute({ sql: "DELETE FROM links WHERE slug = ?", args: [slug] });
  return res.status(200).json({ message: "Link deleted successfully." });
}

// --- Handler to update a link ---
export async function handleUpdateLink(req, res, db, bodyData) {
  const { originalSlug, destinationUrl, newSlug, password } = bodyData;
  if (!originalSlug || !destinationUrl) {
    return res.status(400).json({ error: "Original slug and destination URL are required." });
  }

  if (newSlug && newSlug !== originalSlug) {
    const existing = await db.execute({ sql: "SELECT slug FROM links WHERE slug = ?", args: [newSlug] });
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Slug "${newSlug}" is already in use.` });
    }
  }
  
  // Check if the password field was submitted.
  if (Object.prototype.hasOwnProperty.call(bodyData, 'password')) {
    // If password is an empty string, set it to null. Otherwise, hash it.
    const hashedPassword = password ? bcrypt.hashSync(password, bcrypt.genSaltSync(10)) : null;
    await db.execute({
      sql: "UPDATE links SET url = ?, slug = ?, password = ? WHERE slug = ?",
      args: [destinationUrl, newSlug || originalSlug, hashedPassword, originalSlug]
    });
  } else {
    // If no new password was provided, update the link but keep the existing password.
    await db.execute({
      sql: "UPDATE links SET url = ?, slug = ? WHERE slug = ?",
      args: [destinationUrl, newSlug || originalSlug, originalSlug]
    });
  }

  return res.status(200).json({ message: "Link updated successfully." });
}

// --- UPDATED: Handler to verify a password ---
export async function handleVerifyPassword(req, res, db, bodyData) {
  const { slug, password } = bodyData;
  if (!slug || !password) return res.status(400).json({ error: "Slug and password are required." });
  const result = await db.execute({ sql: "SELECT url, password FROM links WHERE slug = ?", args: [slug] });
  if (result.rows.length === 0 || !result.rows[0].password) return res.status(404).json({ error: "Protected link not found." });
  
  const link = result.rows[0];
  const isPasswordCorrect = bcrypt.compareSync(password, link.password);

  if (isPasswordCorrect) {
    try {
        // FIXED: Ensure undefined headers are converted to null
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const referrer = req.headers['referer'] || null;
        
        await db.batch([
          { sql: "INSERT INTO clicks (link_slug, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)", args: [slug, ip, userAgent, referrer] },
          { sql: "UPDATE links SET click_count = click_count + 1 WHERE slug = ?", args: [slug] }
        ], 'write');
    } catch (dbError) { 
        console.error(`[ERROR][API] Failed to log analytics for protected slug ${slug}:`, dbError); 
    }
    return res.status(200).json({ destinationUrl: link.url });
  } else {
    return res.status(401).json({ error: "Invalid password." });
  }
}

// --- Handler for creating a short URL ---
export async function handleShortenUrl(req, res, db, bodyData) {
  const { url: longUrl, slug: customSlug, hostname, password } = bodyData;
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
  let hashedPassword = null;
  if (password) {
    const salt = bcrypt.genSaltSync(10);
    hashedPassword = bcrypt.hashSync(password, salt);
  }
  await db.execute({ 
    sql: "INSERT INTO links (slug, url, hostname, password) VALUES (?, ?, ?, ?)", 
    args: [slug, longUrl, hostname, hashedPassword] 
  });
  const shortUrl = `https://${hostname}/${slug}`;
  return res.status(200).json({ shortUrl });
}

// --- Other handlers ---
export async function handleGetLinkDetails(req, res, db) {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Slug is required." });
    const result = await db.execute({ sql: "SELECT * FROM clicks WHERE link_slug = ? ORDER BY clicked_at DESC", args: [slug] });
    return res.status(200).json(result.rows);
}
export async function handleGetLinks(req, res, db) {
    const result = await db.execute("SELECT slug, url, created_at, click_count, hostname, password FROM links ORDER BY created_at DESC");
    return res.status(200).json(result.rows);
}
export async function handleGetDomains(req, res, db) {
    const result = await db.execute("SELECT hostname FROM domains ORDER BY added_at ASC");
    return res.status(200).json(result.rows);
}
export async function handleDeleteDomain(req, res, db, bodyData) {
    const { hostname } = bodyData;
    if (!hostname) return res.status(400).json({ error: "Hostname is required." });
    const countResult = await db.execute("SELECT COUNT(*) as count FROM domains");
    if (countResult.rows[0].count <= 1) return res.status(400).json({ error: "Cannot delete the last domain." });
    await db.execute({ sql: "DELETE FROM domains WHERE hostname = ?", args: [hostname] });
    return res.status(200).json({ message: "Domain deleted successfully." });
}
export async function handleAddDomain(req, res, db, bodyData) {
    const { hostname } = bodyData;
    if (!hostname) return res.status(400).json({ error: "Invalid hostname." });
    const existing = await db.execute({ sql: "SELECT hostname FROM domains WHERE hostname = ?", args: [hostname] });
    if (existing.rows.length > 0) return res.status(409).json({ error: "Domain already exists." });
    await db.execute({ sql: "INSERT INTO domains (hostname) VALUES (?)", args: [hostname] });
    return res.status(201).json({ message: "Domain added successfully." });
}