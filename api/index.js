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
// Import BOTH paste handlers
import { handleCreatePaste, handleGetPaste } from './_paste_handlers.js';

// Load the password from environment variables at the top level
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;

export default async function handler(req, res) {
  // --- CORS HANDLING FOR OBSIDIAN PLUGIN ---
  res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Respond to preflight requests (sent by browsers/fetch clients to check CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // --- END CORS HANDLING ---

  const { method, url } = req;
  // The path no longer includes '/api' after the Vercel rewrite
  const path = url.split("?")[0];

  try {
    let bodyData = {};
    if (req.body) {
      // Ensure body is parsed correctly
      bodyData = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
    }

    // --- PUBLICLY ACCESSIBLE ROUTES ---
    // Note the paths are now checked without the '/api' prefix

    // LOGIN ROUTE
    if (path === "/login" && method === "POST") {
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

    // VERIFY LINK PASSWORD ROUTE
    if (path === "/verify-password" && method === "POST") {
        if (!db) {
            return res.status(500).json({ error: "Database connection failed." });
        }
        return await handleVerifyPassword(req, res, db, bodyData);
    }

    // GET PASTE CONTENT ROUTE (Public)
    if (path === "/get-paste" && method === "GET") {
        if (!db) {
            return res.status(500).json({ error: "Database connection failed." });
        }
        return await handleGetPaste(req, res, db);
    }


    // --- AUTHENTICATION CHECK FOR ALL OTHER API ROUTES ---
    let isAuthenticated = false;
    try {
        if (!DASHBOARD_PASSWORD) {
            throw new Error("Server configuration error: DASHBOARD_PASSWORD is not set.");
        }

        // METHOD 1: Check for Authorization header (for plugins/external tools)
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7, authHeader.length);
            if (token === DASHBOARD_PASSWORD) {
                isAuthenticated = true;
            }
        }

        // METHOD 2: Check for auth cookie (for the web dashboard)
        if (!isAuthenticated) {
            const cookies = parse(req.headers.cookie || '');
            const token = cookies.auth_token;
            if (token) {
                jwt.verify(token, DASHBOARD_PASSWORD);
                isAuthenticated = true;
            }
        }

        if (!isAuthenticated) {
            throw new Error('Authentication required.');
        }

    } catch (error) {
        return res.status(401).json({ error: 'Authentication required. Please log in again or provide a valid token.' });
    }

    // If authentication passes, connect to DB and proceed to protected routes
    if (!db) {
      return res.status(500).json({ error: "Database connection failed." });
    }

    // --- PROTECTED API ROUTES ---
    // Note the paths are now checked without the '/api' prefix
    if (path === "/create-paste" && method === "POST") return await handleCreatePaste(req, res, db, bodyData);
    if (path === "/link-details" && method === "GET") return await handleGetLinkDetails(req, res, db);
    if (path === "/domains" && method === "GET") return await handleGetDomains(req, res, db);
    if (path === "/domains" && method === "DELETE") return await handleDeleteDomain(req, res, db, bodyData);
    if (path === "/links" && method === "GET") return await handleGetLinks(req, res, db);
    if (path === "/links" && method === "DELETE") return await handleDeleteLink(req, res, db, bodyData);
    if (path === "/links" && method === "PUT") return await handleUpdateLink(req, res, db, bodyData);
    if (path === "/add-domain" && method === "POST") return await handleAddDomain(req, res, db, bodyData);
    if (path === "/shorten" && method === "POST") return await handleShortenUrl(req, res, db, bodyData);

    return res.status(404).json({ error: `API route not found for path: ${path}` });

  } catch (error) {
    console.error("[FATAL][API] An unhandled error occurred:", error);
    return res.status(500).json({ error: "Internal Server Error. Check logs." });
  }
}