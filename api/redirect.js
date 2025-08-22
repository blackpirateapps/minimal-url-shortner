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
        // If password protected, redirect to the password page.
        // The click will be logged after successful verification.
        console.log(`[INFO][Redirect] Password required for slug: ${slug}.`);
        return res.redirect(302, `/password.html?slug=${slug}`);
      }
      
      // --- START: Updated Analytics Logging ---
      // For public links, we now AWAIT the database operations before redirecting.
      try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const referrer = req.headers['referer'];
        
        await db.batch([
          { sql: "INSERT INTO clicks (link_slug, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)", args: [slug, ip, userAgent, referrer] },
          { sql: "UPDATE links SET click_count = click_count + 1 WHERE slug = ?", args: [slug] }
        ], 'write');
        console.log(`[INFO][Redirect] Logged click for public slug: ${slug}`);
      } catch (dbError) {
        console.error(`[ERROR][Redirect] Failed to log analytics for slug ${slug}:`, dbError);
        // We still redirect the user even if logging fails.
      }
      // --- END: Updated Analytics Logging ---

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
