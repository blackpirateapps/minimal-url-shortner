// /api/_paste_handlers.js
import { customAlphabet } from "nanoid";
import bcrypt from 'bcryptjs';

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10); // Longer slug for pastes

// --- Handler for creating a paste ---
export async function handleCreatePaste(req, res, db, bodyData) {
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