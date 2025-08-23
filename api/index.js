// /api/index.js

import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import db from './_db.js';
import {
  handleAddDomain, handleShortenUrl, handleGetLinks, handleGetDomains,
  handleDeleteDomain, handleGetLinkDetails, handleVerifyPassword,
  handleDeleteLink, handleUpdateLink
} from './_handlers.js';
import { handleCreatePaste } from './_paste_handlers.js'; // Import for paste feature

// Load the password from environment variables at the top level
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;

export default async function handler(req, res) {
  const { method, url } = req;
  const path = url.split("?")[0];

  try {
    let bodyData = {};
    if (req.body) {
      // Ensure body is parsed correctly
      bodyData = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
    }

    // --- PUBLICLY ACCESSIBLE ROUTES ---

    // LOGIN ROUTE
    if (path === "/api/login" && method === "POST") {
      if (!DASHBOARD_PASSWORD) {
        console.error("[FATAL][API] DASHBOARD_PASSWORD environment variable is not set.");
        return res.status(500).json({ error: "Server configuration error." });
      }
      const { password, rememberMe } = bodyData;
      if (password === DASHBOARD_PASSWORD) {
        const token = jwt.sign({ user: 'admin' }, DASHBOARD_PASSWORD, { expiresIn: rememberMe ? '30d' : '24h' });
        const cookie = serialize('auth_token', token, {
          httpOnly: true,
          secure: req.headers['x-forwarded-proto'] === 'https',
          sameSite: 'strict',
          maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
          path: '/',
        });
        res.setHeader('Set-Cookie', cookie);
        return res.status(200).json({ message: 'Login successful.' });
      } else {
        return res.status(401).json({ error: 'Invalid password.' });
      }
    }

    // VERIFY PASSWORD ROUTE (FIXED)
    // This route is public to allow non-authenticated users to unlock links.
    if (path === "/api/verify-password" && method === "POST") {
        if (!db) {
            return res.status(500).json({ error: "Database connection failed." });
        }
        return await handleVerifyPassword(req, res, db, bodyData);
    }


    // --- AUTHENTICATION CHECK FOR ALL OTHER API ROUTES ---
    try {
      if (!DASHBOARD_PASSWORD) {
          console.error("[FATAL][API] DASHBOARD_PASSWORD is not available for auth check.");
          return res.status(500).json({ error: "Server configuration error." });
      }
      const cookies = parse(req.headers.cookie || '');
      const token = cookies.auth_token;
      if (!token) throw new Error('No auth token');
      jwt.verify(token, DASHBOARD_PASSWORD);
    } catch (error) {
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }

    // If authentication passes, connect to DB and proceed to protected routes
    if (!db) {
      return res.status(500).json({ error: "Database connection failed." });
    }

    // --- PROTECTED API ROUTES ---
    if (path === "/api/create-paste" && method === "POST") return await handleCreatePaste(req, res, db, bodyData);
    if (path === "/api/link-details" && method === "GET") return await handleGetLinkDetails(req, res, db);
    if (path === "/api/domains" && method === "GET") return await handleGetDomains(req, res, db);
    if (path === "/api/domains" && method === "DELETE") return await handleDeleteDomain(req, res, db, bodyData);
    if (path === "/api/links" && method === "GET") return await handleGetLinks(req, res, db);
    if (path === "/api/links" && method === "DELETE") return await handleDeleteLink(req, res, db, bodyData);
    if (path === "/api/links" && method === "PUT") return await handleUpdateLink(req, res, db, bodyData);
    if (path === "/api/add-domain" && method === "POST") return await handleAddDomain(req, res, db, bodyData);
    if (path === "/api/shorten" && method === "POST") return await handleShortenUrl(req, res, db, bodyData);

    return res.status(404).json({ error: "API route not found." });

  } catch (error) {
    console.error("[FATAL][API] An unhandled error occurred:", error);
    return res.status(500).json({ error: "Internal Server Error. Check logs." });
  }
}