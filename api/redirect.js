// /api/redirect.js

import db from './_db.js';

export default async function handler(req, res) {
  if (!db) {
    console.error("[FATAL][Redirect] DB client is not available.");
    return res.status(500).send('Server configuration error.');
  }

  // Read the slug from the query parameter defined in vercel.json
  const { slug } = req.query;

  if (!slug || slug === 'favicon.ico') {
    return res.status(404).send('Not Found');
  }
  
  try {
    console.log(`[INFO][Redirect] Attempting redirect for slug: ${slug}`);
    const result = await db.execute({ sql: "SELECT url FROM links WHERE slug = ?", args: [slug] });

    if (result.rows.length > 0) {
      const longUrl = result.rows[0].url;
      console.log(`[INFO][Redirect] Redirecting ${slug} to ${longUrl}`);
      return res.redirect(308, longUrl);
    } else {
      console.log(`[WARN][Redirect] Slug not found: ${slug}`);
      return res.status(404).send('Short link not found.');
    }
  } catch (error) {
    console.error("[FATAL][Redirect] An unhandled error occurred:", error);
    return res.status(500).send('Internal Server Error.');
  }
}
