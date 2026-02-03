const form = document.getElementById('settings-form');
const instanceUrlInput = document.getElementById('instance-url');
const passwordInput = document.getElementById('password');
const defaultDomainInput = document.getElementById('default-domain');
const statusEl = document.getElementById('status');

// Load saved settings
async function loadSettings() {
    const data = await browser.storage.local.get(['instanceUrl', 'password', 'defaultDomain']);

    if (data.instanceUrl) {
        instanceUrlInput.value = data.instanceUrl;
    }
    if (data.password) {
        passwordInput.value = data.password;
    }
    if (data.defaultDomain) {
        defaultDomainInput.value = data.defaultDomain;
    }
}

// Show status message
function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = `status ${isError ? 'error' : 'success'}`;
    statusEl.classList.remove('hidden');

    setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 3000);
}

// Save settings
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let instanceUrl = instanceUrlInput.value.trim();
    const password = passwordInput.value;
    const defaultDomain = defaultDomainInput.value.trim();

    // Remove trailing slash
    if (instanceUrl.endsWith('/')) {
        instanceUrl = instanceUrl.slice(0, -1);
    }

    // Validate by testing the connection
    try {
        const response = await fetch(`${instanceUrl}/api/domains`, {
            headers: {
                'Authorization': `Bearer ${password}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showStatus('Invalid password. Please check your credentials.', true);
            } else {
                showStatus(`Connection failed: ${response.status}`, true);
            }
            return;
        }

        // If successful, save settings
        await browser.storage.local.set({
            instanceUrl,
            password,
            defaultDomain: defaultDomain || null
        });

        showStatus('Settings saved successfully!');

    } catch (err) {
        showStatus(`Could not connect: ${err.message}`, true);
    }
});

// Load settings on page load
loadSettings();
