// /api/redirect.js

import db from './_db.js';
import bcrypt from 'bcryptjs';
import { sendToUmami } from './umami.js';

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
        const providedPassword = req.query.password || req.headers['x-link-password'];
        if (providedPassword && bcrypt.compareSync(providedPassword, password)) {
          console.log(`[INFO][Redirect] Password verified via query/header for slug: ${slug}.`);
        } else {
          console.log(`[INFO][Redirect] Password required for slug: ${slug}. Redirecting to /password.`);
          return res.redirect(302, `/password?slug=${slug}`);
        }
      }
      
      // --- START: Analytics Logging ---
      try {
        // Step 1: Send to Umami
        await sendToUmami(req, slug);

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
      // --- END: Analytics Logging ---

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
