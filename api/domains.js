// api/domains.js
import { db } from './_lib/db.js';

const ADMIN_PASSWORD = process.env.DASHBOARD_PASSWORD;

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, hostname, password } = request.body;

    // Authenticate the request
    if (password !== ADMIN_PASSWORD) {
        return response.status(401).json({ error: 'Unauthorized: Invalid password.' });
    }

    try {
        if (action === 'add') {
            if (!hostname) {
                return response.status(400).json({ error: 'Hostname is required.' });
            }
            await db.execute({
                sql: "INSERT INTO domains (hostname) VALUES (?)",
                args: [hostname.toLowerCase()],
            });
            return response.status(200).json({ message: 'Domain added successfully.' });
        } 
        
        else if (action === 'list') {
            const result = await db.execute("SELECT hostname FROM domains ORDER BY added_at DESC");
            return response.status(200).json({ domains: result.rows });
        } 
        
        else {
            return response.status(400).json({ error: 'Invalid action specified.' });
        }
    } catch (error) {
        console.error(error);
        // Handle unique constraint violation for adding a duplicate domain
        if (error.message.includes('UNIQUE constraint failed')) {
            return response.status(409).json({ error: 'This domain has already been added.' });
        }
        return response.status(500).json({ error: 'Database error.' });
    }
}
