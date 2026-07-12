// /api/umami.js
export async function sendToUmami(req, slug) {
    const umamiUrl = process.env.UMAMI_URL;
    const websiteId = process.env.UMAMI_WEBSITE_ID;
    
    if (!umamiUrl || !websiteId) return;
    // Clean up trailing slash from URL if present
    const cleanUmamiUrl = umamiUrl.replace(/\/$/, '');

    try {
        const payload = {
            payload: {
                website: websiteId,
                url: `/${slug}`,
                hostname: req.headers['host'] || '',
                referrer: req.headers['referer'] || ''
            },
            type: "event"
        };
        
        let clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
        if (clientIp) {
            clientIp = clientIp.split(',')[0].trim(); // Vercel often provides multiple IPs, we just want the original client's IP
        }
        const userAgent = req.headers['user-agent'];
        
        const response = await fetch(`${cleanUmamiUrl}/api/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': userAgent || '',
                'x-forwarded-for': clientIp,
                'x-real-ip': clientIp,
                'x-client-ip': clientIp,
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ERROR][Umami] Tracking failed. Status: ${response.status} ${response.statusText}`, errorText);
        }
    } catch (error) {
        console.error("[ERROR][Umami] Tracking request threw an error:", error);
    }
}
