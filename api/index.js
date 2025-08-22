// /api/index.js

import db from './_db.js'; 
import { 
  handleAddDomain, 
  handleShortenUrl, 
  handleGetLinks,
  handleGetDomains,
  handleDeleteDomain
} from './_handlers.js';

export default async function handler(req, res) {
  console.log(`[INFO][API] Handler invoked for method=${req.method} path=${req.url}`);

  if (!db) {
    console.error("[FATAL][API] Main handler cannot proceed because DB client is not available.");
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

    // --- Routing Logic (API only) ---
    if (path === "/api/domains" && method === "GET") {
      return await handleGetDomains(req, res, db);
    }
    
    if (path === "/api/domains" && method === "DELETE") {
      return await handleDeleteDomain(req, res, db, bodyData);
    }
    
    if (path === "/api/links" && method === "GET") {
      return await handleGetLinks(req, res, db);
    }
    
    if (path === "/api/add-domain" && method === "POST") {
      return await handleAddDomain(req, res, db, bodyData);
    }

    if (path === "/api/shorten" && method === "POST") {
      return await handleShortenUrl(req, res, db, bodyData);
    }

    // --- Fallback for any unknown /api/ calls ---
    console.log(`[WARN][API] No API route matched for path: ${path}. Returning 404.`);
    return res.status(404).json({ error: "API route not found." });

  } catch (error) {
    console.error("[FATAL][API] An unhandled error occurred:", error);
    return res.status(500).json({ error: "Internal Server Error. Check logs." });
  }
}
