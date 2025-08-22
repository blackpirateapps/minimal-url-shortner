// api/shorten.js
import { db } from '../_lib/db.js'; // <-- UPDATED PATH
import { nanoid } from 'nanoid';

const ADMIN_PASSWORD = process.env.DASHBOARD_PASSWORD;

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url, password } = request.body;

    // 1. Authenticate the request
    if (password !== ADMIN_PASSWORD) {
        return response.status(401).json({ error: 'Unauthorized: Invalid password.' });
    }

    // 2. Validate the input
    if (!url) {
        return response.status(400).json({ error: 'URL is required.' });
    }
    try {
        new URL(url); // Check if the URL is valid
    } catch (e) {
        return response.status(400).json({ error: 'Invalid URL format.' });
    }

    try {
        // 3. Generate a unique slug and save to the database
        const slug = nanoid(8); // e.g., 'aB3dEfG9'
        await db.execute({
            sql: "INSERT INTO links (slug, url) VALUES (?, ?)",
            args: [slug, url],
        });
        
        // 4. Return the full short URL
        const host = request.headers['x-forwarded-host'] || request.headers.host;
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const shortUrl = `${protocol}://${host}/${slug}`;

        return response.status(200).json({ shortUrl });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Database error: Failed to create short link.' });
    }
}
