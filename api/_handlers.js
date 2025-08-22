// /api/_handlers.js
import { customAlphabet } from "nanoid";
import bcrypt from 'bcryptjs';

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7);

// --- NEW: Handler to delete a link ---
export async function handleDeleteLink(req, res, db, bodyData) {
  const { slug } = bodyData;
  if (!slug) {
    return res.status(400).json({ error: "Slug is required to delete a link." });
  }
  await db.execute({ sql: "DELETE FROM links WHERE slug = ?", args: [slug] });
  return res.status(200).json({ message: "Link deleted successfully." });
}

// --- NEW: Handler to update a link ---
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
  
  let hashedPassword = null;
  // Only hash a new password if one was provided. Otherwise, we'll keep the old one.
  if (password) {
    const salt = bcrypt.genSaltSync(10);
    hashedPassword = bcrypt.hashSync(password, salt);
  }

  // If a new password was provided, update it. Otherwise, keep the existing password.
  const sql = hashedPassword 
    ? "UPDATE links SET url = ?, slug = ?, password = ? WHERE slug = ?"
    : "UPDATE links SET url = ?, slug = ? WHERE slug = ?";
  
  const args = hashedPassword
    ? [destinationUrl, newSlug || originalSlug, hashedPassword, originalSlug]
    : [destinationUrl, newSlug || originalSlug, originalSlug];

  await db.execute({ sql, args });

  return res.status(200).json({ message: "Link updated successfully." });
}

// --- Handler to verify a password ---
export async function handleVerifyPassword(req, res, db, bodyData) {
  const { slug, password } = bodyData;
  if (!slug || !password) return res.status(400).json({ error: "Slug and password are required." });
  const result = await db.execute({ sql: "SELECT url, password FROM links WHERE slug = ?", args: [slug] });
  if (result.rows.length === 0 || !result.rows[0].password) return res.status(404).json({ error: "Protected link not found." });
  const link = result.rows[0];
  const isPasswordCorrect = bcrypt.compareSync(password, link.password);
  if (isPasswordCorrect) {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const referrer = req.headers['referer'];
        await db.batch([
          { sql: "INSERT INTO clicks (link_slug, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)", args: [slug, ip, userAgent, referrer] },
          { sql: "UPDATE links SET click_count = click_count + 1 WHERE slug = ?", args: [slug] }
        ], 'write');
    } catch (dbError) { console.error(`[ERROR][API] Failed to log analytics for protected slug ${slug}:`, dbError); }
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
export async function handleGetLinkDetails(req, res, db) { /* ... same as before ... */ }
export async function handleGetLinks(req, res, db) { /* ... same as before ... */ }
export async function handleGetDomains(req, res, db) { /* ... same as before ... */ }
export async function handleDeleteDomain(req, res, db, bodyData) { /* ... same as before ... */ }
export async function handleAddDomain(req, res, db, bodyData) { /* ... same as before ... */ }
