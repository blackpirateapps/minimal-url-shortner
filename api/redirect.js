// /api/redirect.js

import db from './_db.js';

export default async function handler(req, res) {
  if (!db) {
    console.error("[FATAL][Redirect] DB client is not available.");
    return res.status(500).send('Server configuration error.');
  }

  const { slug } = req.query;

  if (!slug || slug === 'favicon.ico') {
    return res.status(404).send('Not Found');
  }
  
  try {
    const result = await db.execute({ 
      sql: "SELECT url, password FROM links WHERE slug = ?", 
      args: [slug] 
    });

    if (result.rows.length > 0) {
      const { url: longUrl, password } = result.rows[0];
      
      if (password) {
        // This part is working correctly. The click is logged after verification.
        console.log(`[INFO][Redirect] Password required for slug: ${slug}.`);
        return res.redirect(302, `/password.html?slug=${slug}`);
      }
      
      // --- START: Fixed Analytics Logging ---
      try {
        // FIXED: Ensure undefined headers are converted to null for the database
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const referrer = req.headers['referer'] || null;
        
        // Step 1: Insert the detailed click record and wait for it to finish.
        await db.execute({
          sql: "INSERT INTO clicks (link_slug, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)",
          args: [slug, ip, userAgent, referrer]
        });

        // Step 2: Increment the counter on the main link table and wait for it to finish.
        await db.execute({
          sql: "UPDATE links SET click_count = click_count + 1 WHERE slug = ?",
          args: [slug]
        });

        console.log(`[INFO][Redirect] Successfully logged click for public slug: ${slug}`);
      } catch (dbError) {
        console.error(`[ERROR][Redirect] Failed to log analytics for slug ${slug}:`, dbError);
        // Even if logging fails, we still redirect the user so the link works.
      }
      // --- END: Fixed Analytics Logging ---

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
