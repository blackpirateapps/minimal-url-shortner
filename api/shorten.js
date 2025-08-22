// api/shorten.js
import { db } from '../_lib/db.js';
import { nanoid } from 'nanoid';

// The password is read from Vercel Environment Variables
const ADMIN_PASSWORD = process.env.DASHBOARD_PASSWORD;

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url, password } = request.body;

    // Password protection check
    if (password !== ADMIN_PASSWORD) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    if (!url) {
        return response.status(400).json({ error: 'URL is required' });
    }

    try {
        // Generate a unique, short, URL-friendly slug
        const slug = nanoid(7); // e.g., 'y9f7aZ2'

        // Insert the new link into the database
        await db.execute({
            sql: "INSERT INTO links (slug, url) VALUES (?, ?)",
            args: [slug, url],
        });
        
        // Construct the full short URL to return to the user
        const shortUrl = `https://${request.headers.host}/api/r/${slug}`;

        return response.status(200).json({ shortUrl });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to create short link' });
    }
}
