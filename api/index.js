// /api/index.js

import db from './_db.js'; 
import { 
  handleAddDomain, 
  handleShortenUrl, 
  handleGetLinks,
  handleGetDomains,
  handleDeleteDomain,
  handleGetLinkDetails // Import the new handler
} from './_handlers.js';

export default async function handler(req, res) {
  if (!db) {
    return res.status(500).json({ error: "Server configuration error. Check logs." });
  }

  const { method, url } = req;
  const path = url.split("?")[0];

  try {
    let bodyData = {};
    if (req.body) {
      bodyData = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
    }

    // --- Routing Logic ---
    if (path === "/api/link-details" && method === "GET") {
      return await handleGetLinkDetails(req, res, db);
    }
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

    return res.status(404).json({ error: "API route not found." });

  } catch (error) {
    console.error("[FATAL][API] An unhandled error occurred:", error);
    return res.status(500).json({ error: "Internal Server Error. Check logs." });
  }
}
