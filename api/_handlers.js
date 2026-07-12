// /api/_handlers.js
import { customAlphabet } from "nanoid";
import bcrypt from 'bcryptjs';
import { sendToUmami } from './umami.js';

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
        await sendToUmami(req, slug);
        await db.execute({ sql: "UPDATE links SET click_count = click_count + 1 WHERE slug = ?", args: [slug] });
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

    const umamiUrl = process.env.UMAMI_URL;
    const websiteId = process.env.UMAMI_WEBSITE_ID;
    const username = process.env.UMAMI_USERNAME;
    const password = process.env.UMAMI_PASSWORD;

    if (!umamiUrl || !websiteId || (!username || !password)) {
         return res.status(503).json({ error: "Umami is not configured. Missing UMAMI_URL, UMAMI_WEBSITE_ID, UMAMI_USERNAME, or UMAMI_PASSWORD." });
    }

    try {
        // Authenticate with Umami to get a token
        const authRes = await fetch(`${umamiUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!authRes.ok) {
            console.error("Umami auth failed");
            return res.status(401).json({ error: "Failed to authenticate with Umami." });
        }
        
        const authData = await authRes.json();
        const token = authData.token;
        const authHeader = { 'Authorization': `Bearer ${token}` };

        const endAt = Date.now();
        const startAt = endAt - 30 * 24 * 60 * 60 * 1000; // last 30 days
        const queryUrl = `/${slug}`;

        // Fetch stats
        const statsRes = await fetch(`${umamiUrl}/api/websites/${websiteId}/stats?url=${encodeURIComponent(queryUrl)}&startAt=${startAt}&endAt=${endAt}`, {
            headers: authHeader
        });
        const stats = await statsRes.json();

        // Helper to fetch metrics
        const fetchMetric = async (type) => {
             const res = await fetch(`${umamiUrl}/api/websites/${websiteId}/metrics?url=${encodeURIComponent(queryUrl)}&startAt=${startAt}&endAt=${endAt}&type=${type}`, {
                  headers: authHeader
             });
             return res.json();
        };

        const referrers = await fetchMetric('referrer');
        const browsers = await fetchMetric('browser');
        const os = await fetchMetric('os');
        const countries = await fetchMetric('country');

        // Fetch pageviews over time (for charts)
        const pageviewsRes = await fetch(`${umamiUrl}/api/websites/${websiteId}/pageviews?url=${encodeURIComponent(queryUrl)}&startAt=${startAt}&endAt=${endAt}&unit=day`, {
             headers: authHeader
        });
        const pageviews = await pageviewsRes.json();

        return res.status(200).json({
             stats,
             referrers,
             browsers,
             os,
             countries,
             pageviews
        });
    } catch (e) {
        console.error("Umami API error:", e);
        return res.status(500).json({ error: "Failed to fetch analytics from Umami." });
    }
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