// Create context menu on install
browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
        id: 'shorten-link',
        title: 'Shorten this link',
        contexts: ['link']
    });

    browser.contextMenus.create({
        id: 'shorten-page',
        title: 'Shorten this page',
        contexts: ['page']
    });
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const url = info.linkUrl || info.pageUrl;

    if (!url) return;

    try {
        const settings = await browser.storage.local.get(['instanceUrl', 'password', 'defaultDomain']);

        if (!settings.instanceUrl || !settings.password) {
            browser.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-96.png',
                title: 'RapidLink',
                message: 'Please configure your instance in the extension settings.'
            });
            return;
        }

        // Get hostname
        let hostname = settings.defaultDomain;

        if (!hostname) {
            const domainsRes = await fetch(`${settings.instanceUrl}/api/domains`, {
                headers: {
                    'Authorization': `Bearer ${settings.password}`
                }
            });

            if (domainsRes.ok) {
                const domains = await domainsRes.json();
                if (domains.length > 0) {
                    hostname = domains[0].hostname;
                }
            }
        }

        if (!hostname) {
            browser.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-96.png',
                title: 'RapidLink',
                message: 'No domain available. Please add a domain in your dashboard.'
            });
            return;
        }

        // Shorten the URL
        const response = await fetch(`${settings.instanceUrl}/api/shorten`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.password}`
            },
            body: JSON.stringify({
                url: url,
                hostname: hostname
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to shorten URL');
        }

        // Copy to clipboard
        await navigator.clipboard.writeText(data.shortUrl);

        // Show notification
        browser.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-96.png',
            title: 'URL Shortened!',
            message: `${data.shortUrl}\n\nCopied to clipboard!`
        });

    } catch (err) {
        browser.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-96.png',
            title: 'RapidLink Error',
            message: err.message || 'Failed to shorten URL'
        });
    }
});
