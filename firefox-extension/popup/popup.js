// DOM Elements
const setupRequired = document.getElementById('setup-required');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const errorDiv = document.getElementById('error');
const shortUrlInput = document.getElementById('short-url');
const copyBtn = document.getElementById('copy-btn');
const shareBtn = document.getElementById('share-btn');
const copiedMsg = document.getElementById('copied-msg');
const errorMsg = document.getElementById('error-msg');
const openSettingsBtn = document.getElementById('open-settings');
const retryBtn = document.getElementById('retry-btn');

let currentUrl = '';

// Show a specific section
function showSection(section) {
    [setupRequired, loading, result, errorDiv].forEach(el => el.classList.add('hidden'));
    section.classList.remove('hidden');
}

// Get settings from storage
async function getSettings() {
    const data = await browser.storage.local.get(['instanceUrl', 'password', 'defaultDomain']);
    return data;
}

// Shorten the URL
async function shortenUrl(url) {
    const settings = await getSettings();

    if (!settings.instanceUrl || !settings.password) {
        showSection(setupRequired);
        return;
    }

    showSection(loading);

    try {
        // First, get available domains if no default is set
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
            throw new Error('No domain configured. Please add a domain in your dashboard first.');
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

        // Success!
        shortUrlInput.value = data.shortUrl;
        showSection(result);

        // Auto-copy to clipboard
        try {
            await navigator.clipboard.writeText(data.shortUrl);
            showCopied();
        } catch (e) {
            console.log('Auto-copy failed, user can manually copy');
        }

        // Show share button on mobile (if Web Share API is available)
        if (navigator.share) {
            shareBtn.classList.remove('hidden');
        }

    } catch (err) {
        errorMsg.textContent = err.message || 'Something went wrong';
        showSection(errorDiv);
    }
}

// Show "Copied!" message
function showCopied() {
    copiedMsg.classList.remove('hidden');
    setTimeout(() => copiedMsg.classList.add('hidden'), 2000);
}

// Event Listeners
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(shortUrlInput.value);
        showCopied();
    } catch (e) {
        // Fallback: select the input
        shortUrlInput.select();
        document.execCommand('copy');
        showCopied();
    }
});

shareBtn.addEventListener('click', async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Shared Link',
                url: shortUrlInput.value
            });
        } catch (e) {
            // User cancelled or error
        }
    }
});

openSettingsBtn.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
});

retryBtn.addEventListener('click', () => {
    if (currentUrl) {
        shortenUrl(currentUrl);
    }
});

// Initialize
async function init() {
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].url) {
            currentUrl = tabs[0].url;

            // Don't shorten internal browser pages
            if (currentUrl.startsWith('about:') || currentUrl.startsWith('moz-extension:')) {
                errorMsg.textContent = 'Cannot shorten browser internal pages';
                showSection(errorDiv);
                return;
            }

            await shortenUrl(currentUrl);
        } else {
            errorMsg.textContent = 'Could not get current tab URL';
            showSection(errorDiv);
        }
    } catch (e) {
        errorMsg.textContent = e.message || 'Failed to get tab URL';
        showSection(errorDiv);
    }
}

init();
