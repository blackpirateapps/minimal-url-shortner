// /api/index.js

import db from './_db.js'; 
import { handleAddDomain, handleShortenUrl, handleRedirect, handleGetLinks } from './_handlers.js';

export default async function handler(req, res) {
  console.log(`[INFO] Handler invoked for method=${req.method} path=${req.url}`);

  if (!db) {
    console.error("[FATAL] Main handler cannot proceed because DB client is not available.");
    return res.status(500).json({ error: "Server configuration error. Check logs." });
  }

  const { method, url } = req;
  const path = url.split("?")[0];

  try {
    let bodyData = {};
    if (req.body) {
      try {
        bodyData = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON in request body." });
      }
    }

    // --- Routing Logic ---
    if (path === "/api/links" && method === "GET") {
      return await handleGetLinks(req, res, db);
    }
    
    if (path === "/api/add-domain" && method === "POST") {
      return await handleAddDomain(req, res, db, bodyData);
    }

    if (path === "/api/shorten" && method === "POST") {
      return await handleShortenUrl(req, res, db, bodyData);
    }
    
    const slug = path.substring(1);
    if (method === "GET" && slug && slug !== 'api' && !slug.includes('/')) {
        const redirectResult = await handleRedirect(req, res, db, slug);
        if (redirectResult) {
            return redirectResult;
        }
    }

    // --- Fallback ---
    console.log(`[WARN] No route matched for path: ${path}. Returning 404.`);
    return res.status(404).json({ error: "Not Found" });

  } catch (error) {
    console.error("[FATAL] An unhandled error occurred within the main handler:", error);
    return res.status(500).json({ error: "Internal Server Error. Check logs." });
  }
}
