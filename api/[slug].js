// api/[slug].js
import { db } from '../_lib/db.js';
import dashboardHandler from './index.js';

export default async function handler(request, response) {
    const slug = request.query.slug;
    const host = request.headers['x-forwarded-host'] || request.headers.host;

    // --- UPDATED LOGIC ---
    // Use a more reliable environment variable for the main app's hostname.
    // VERCEL_PROJECT_PRODUCTION_URL is the canonical URL for the production deployment.
    // Fallback to VERCEL_URL for preview deployments.
    const appHostname = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

    // If the hostname is not available (e.g., local dev), or if the request
    // is for the root of the main app domain, show the dashboard.
    if (!appHostname || (host === appHostname && (!slug || slug === 'index'))) {
        return dashboardHandler(request, response);
    }
    
    try {
        // Check if the host is a registered custom domain OR the main app domain.
        // This allows short links to work on both.
        let isDomainValid = (host === appHostname);
        if (!isDomainValid) {
            const domainResult = await db.execute({
                sql: "SELECT 1 FROM domains WHERE hostname = ?",
                args: [host],
            });
            if (domainResult.rows.length > 0) {
                isDomainValid = true;
            }
        }

        if (!isDomainValid) {
            return response.status(404).send(`Domain not configured: ${host}`);
        }

        // If the domain is valid, look for the slug
        const linkResult = await db.execute({
            sql: "SELECT url FROM links WHERE slug = ?",
            args: [slug],
        });

        if (linkResult.rows.length > 0) {
            const longUrl = linkResult.rows[0].url;
            // Perform a permanent redirect
            return response.redirect(308, longUrl);
        } else {
            // If slug not found, show 404
            return response.status(404).send('Short link not found.');
        }

    } catch (error) {
        console.error(error);
        return response.status(500).send('Internal Server Error');
    }
}
