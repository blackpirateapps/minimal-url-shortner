// api/r/[slug].js
import { db } from '../_lib/db.js';

export default async function handler(request, response) {
    const { slug } = request.query;

    if (!slug) {
        return response.status(400).json({ error: 'Slug is required' });
    }

    try {
        // Look up the slug in the database
        const result = await db.execute({
            sql: "SELECT url FROM links WHERE slug = ?",
            args: [slug],
        });

        if (result.rows.length > 0) {
            const longUrl = result.rows[0].url;
            // If found, perform a permanent redirect
            return response.redirect(308, longUrl);
        } else {
            // If not found, return a 404 error
            return response.status(404).send('URL not found');
        }
    } catch (error) {
        console.error(error);
        return response.status(500).send('Internal Server Error');
    }
}
