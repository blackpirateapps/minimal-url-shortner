// /api/_paste_handlers.js
import { customAlphabet } from "nanoid";
import bcrypt from 'bcryptjs';

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

// --- Handler for GETTING a paste ---
export async function handleGetPaste(req, res, db) {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: "Paste identifier is required." });
  }

  const result = await db.execute({
    sql: "SELECT content, password, expires_at FROM pastes WHERE slug = ?",
    args: [slug],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Paste not found." });
  }

  const paste = result.rows[0];

  // Check for expiration
  if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
    await db.execute({ sql: "DELETE FROM pastes WHERE slug = ?", args: [slug] });
    return res.status(410).json({ error: "This paste has expired and has been deleted." });
  }

  // Handle password protection (future enhancement)
  if (paste.password) {
      return res.status(403).json({ error: "This paste is password protected."})
  }

  return res.status(200).json({ content: paste.content });
}

// --- Handler for CREATING a paste ---
export async function handleCreatePaste(req, res, db, bodyData) {
  // ... (this existing function remains unchanged)
  const { content, hostname, password, expires } = bodyData;

  if (!content || !hostname) {
    return res.status(400).json({ error: "Content and a domain are required." });
  }

  let slug;
  let existing;
  do {
    slug = nanoid();
    existing = await db.execute({ sql: "SELECT slug FROM pastes WHERE slug = ?", args: [slug] });
  } while (existing.rows.length > 0);

  let hashedPassword = null;
  if (password) {
    const salt = bcrypt.genSaltSync(10);
    hashedPassword = bcrypt.hashSync(password, salt);
  }

  let expiresAt = null;
  if (expires && expires !== 'never') {
      const now = new Date();
      if (expires === '1hour') now.setHours(now.getHours() + 1);
      if (expires === '1day') now.setDate(now.getDate() + 1);
      if (expires === '1week') now.setDate(now.getDate() + 7);
      expiresAt = now.toISOString();
  }

  await db.execute({
    sql: "INSERT INTO pastes (slug, content, hostname, password, expires_at) VALUES (?, ?, ?, ?, ?)",
    args: [slug, content, hostname, hashedPassword, expiresAt]
  });

  const pasteUrl = `https://${hostname}/p/${slug}`;
  return res.status(200).json({ pasteUrl });
}