// /api/login.js

import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { password, rememberMe } = typeof req.body === 'object' ? req.body : JSON.parse(req.body);

    if (password === DASHBOARD_PASSWORD) {
      // Password is correct, create a session token (JWT)
      const token = jwt.sign({ user: 'admin' }, DASHBOARD_PASSWORD, { expiresIn: rememberMe ? '30d' : '24h' });

      // Set the token in a secure, HttpOnly cookie
      const cookie = serialize('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 24 hours
        path: '/',
      });

      res.setHeader('Set-Cookie', cookie);
      return res.status(200).json({ message: 'Login successful.' });
    } else {
      // Incorrect password
      return res.status(401).json({ error: 'Invalid password.' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }
}
