// /api/umami.js
export async function sendToUmami(req, slug) {
    const umamiUrl = process.env.UMAMI_URL;
    const websiteId = process.env.UMAMI_WEBSITE_ID;
    
    if (!umamiUrl || !websiteId) return;

    try {
        const payload = {
            payload: {
                website: websiteId,
                url: `/${slug}`,
                name: "redirect",
                hostname: req.headers['host'] || ''
            },
            type: "event"
        };
        
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        await fetch(`${umamiUrl}/api/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': userAgent || '',
                'x-forwarded-for': ip || '',
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error("[ERROR][Umami] Tracking failed:", error);
    }
}
