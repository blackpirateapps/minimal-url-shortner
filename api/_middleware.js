// /api/_middleware.js

import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;

export default function middleware(req, res, next) {
  const { url, method } = req;
  const path = url.split('?')[0];

  // Allow the login endpoint to be accessed without authentication
  if (path === '/api/login') {
    return next();
  }

  try {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // The password itself is used as the secret key for the token
    jwt.verify(token, DASHBOARD_PASSWORD);
    
    // If verification is successful, proceed to the actual API handler
    next();

  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}
