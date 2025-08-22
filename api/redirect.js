// /api/redirect.js

// We import the shared database connection.
import db from './_db.js';

export default async function handler(req, res) {
  // Check if the database connection is valid.
  if (!db) {
    console.error("[FATAL][Redirect] Handler cannot proceed because DB client is not available.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  // The slug is the entire path of the request, e.g., "/my-awesome-link"
  const slug = req.url.substring(1);

  if (!slug || slug === 'favicon.ico') {
    return res.status(404).send('Not Found');
  }
  
  try {
    console.log(`[INFO][Redirect] Attempting redirect for slug: ${slug}`);
    const result = await db.execute({ sql: "SELECT url FROM links WHERE slug = ?", args: [slug] });

    if (result.rows.length > 0) {
      const longUrl = result.rows[0].url;
      console.log(`[INFO][Redirect] Redirecting ${slug} to ${longUrl}`);
      // Perform a permanent redirect.
      return res.redirect(308, longUrl);
    } else {
      console.log(`[WARN][Redirect] Slug not found: ${slug}`);
      // If the slug doesn't exist, send a 404 error.
      return res.status(404).send('Short link not found.');
    }
  } catch (error) {
    console.error("[FATAL][Redirect] An unhandled error occurred:", error);
    return res.status(500).send('Internal Server Error.');
  }
}
