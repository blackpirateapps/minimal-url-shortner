// api/index.js
// This function serves the main HTML page for the dashboard.

export default function handler(request, response) {
    response.setHeader('Content-Type', 'text/html');
    response.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Shortener Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800">

    <!-- Login Overlay -->
    <div id="login-overlay" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
            <h2 class="text-2xl font-bold mb-6 text-center text-gray-700">Admin Access</h2>
            <form id="login-form">
                <div class="mb-4">
                    <label for="password" class="block text-sm font-medium text-gray-600 mb-2">Password</label>
                    <input type="password" id="password" name="password" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-semibold">Login</button>
            </form>
            <p id="login-error" class="text-red-500 text-sm mt-4 text-center"></p>
        </div>
    </div>

    <!-- Main Dashboard Content (Initially Hidden) -->
    <main id="dashboard" class="hidden container mx-auto p-4 md:p-8 max-w-4xl">
        <header class="mb-10 text-center">
            <h1 class="text-4xl font-bold text-gray-800">URL Shortener</h1>
            <p class="text-gray-500 mt-2">Create short links and manage your custom domains.</p>
        </header>

        <!-- Shorten URL Section -->
        <section class="bg-white p-8 rounded-lg shadow-md mb-8">
            <h2 class="text-2xl font-semibold mb-6">Create a New Short Link</h2>
            <form id="shorten-form" class="space-y-4">
                <div>
                    <label for="url" class="block text-sm font-medium text-gray-600 mb-2">Original URL</label>
                    <input type="url" id="url" name="url" placeholder="https://example.com/a-very-long-url-to-shorten" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <button type="submit" class="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-semibold">Generate Link</button>
            </form>
            <div id="shorten-result" class="mt-6 p-4 bg-gray-100 rounded-md text-center min-h-[50px] flex items-center justify-center">
                Your short link will appear here.
            </div>
        </section>

        <!-- Custom Domain Section -->
        <section class="bg-white p-8 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-6">Manage Custom Domains</h2>
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
                <div class="flex">
                    <div class="py-1"><svg class="h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                    <div>
                        <p class="font-bold">DNS Configuration</p>
                        <p class="text-sm">To use a custom domain, add an <strong class="font-mono">A record</strong> in your DNS provider settings pointing your domain to Vercel's IP address: <code class="bg-gray-200 px-1 py-0.5 rounded font-mono text-sm">76.76.21.21</code></p>
                    </div>
                </div>
            </div>
            <form id="domain-form" class="flex flex-col md:flex-row items-end gap-4">
                <div class="flex-grow w-full">
                    <label for="hostname" class="block text-sm font-medium text-gray-600 mb-2">Domain Name</label>
                    <input type="text" id="hostname" name="hostname" placeholder="short.yourdomain.com" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <button type="submit" class="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors font-semibold">Add Domain</button>
            </form>
            <div id="domain-result" class="mt-4 text-center"></div>
            <div class="mt-6">
                <h3 class="font-semibold mb-2">Active Domains:</h3>
                <ul id="domain-list" class="list-disc list-inside bg-gray-50 p-4 rounded-md text-gray-600">
                    <!-- Domains will be listed here -->
                </ul>
            </div>
        </section>
    </main>

    <script>
        // Use a session-scoped variable to hold the password
        let sessionPassword = null;

        const loginOverlay = document.getElementById('login-overlay');
        const loginForm = document.getElementById('login-form');
        const loginError = document.getElementById('login-error');
        const dashboard = document.getElementById('dashboard');

        // --- Core Functions ---
        async function apiRequest(endpoint, body) {
            if (!sessionPassword) {
                throw new Error('Not authenticated.');
            }
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...body, password: sessionPassword }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'API request failed');
            }
            return result;
        }

        // --- Login Logic ---
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const password = document.getElementById('password').value;
            loginError.textContent = '';

            // Simple check: The password is sent to every API call,
            // so we just store it in a variable for the session.
            sessionPassword = password;

            // Hide overlay and show dashboard
            loginOverlay.classList.add('hidden');
            dashboard.classList.remove('hidden');
            
            // Load initial data
            loadDomains();
        });

        // --- Shorten URL Logic ---
        const shortenForm = document.getElementById('shorten-form');
        const shortenResult = document.getElementById('shorten-result');

        shortenForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const url = document.getElementById('url').value;
            shortenResult.textContent = 'Generating...';
            shortenResult.className = 'mt-6 p-4 bg-gray-100 rounded-md text-center min-h-[50px] flex items-center justify-center';

            try {
                const result = await apiRequest('/api/shorten', { url });
                shortenResult.innerHTML = \`Short URL: <a href="\${result.shortUrl}" target="_blank" class="text-blue-600 font-semibold hover:underline">\${result.shortUrl}</a>\`;
                shortenResult.classList.add('text-green-700', 'bg-green-50');
                shortenForm.reset();
            } catch (error) {
                shortenResult.textContent = \`Error: \${error.message}\`;
                shortenResult.classList.add('text-red-700', 'bg-red-50');
            }
        });

        // --- Domain Management Logic ---
        const domainForm = document.getElementById('domain-form');
        const domainResult = document.getElementById('domain-result');
        const domainList = document.getElementById('domain-list');

        async function loadDomains() {
            domainList.innerHTML = '<li>Loading...</li>';
            try {
                const result = await apiRequest('/api/domains', { action: 'list' });
                domainList.innerHTML = ''; // Clear list
                if (result.domains.length > 0) {
                    result.domains.forEach(domain => {
                        const li = document.createElement('li');
                        li.textContent = domain.hostname;
                        domainList.appendChild(li);
                    });
                } else {
                    domainList.innerHTML = '<li>No custom domains added yet.</li>';
                }
            } catch (error) {
                domainList.innerHTML = \`<li class="text-red-500">Error loading domains: \${error.message}</li>\`;
            }
        }

        domainForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const hostname = document.getElementById('hostname').value;
            domainResult.textContent = 'Adding...';

            try {
                await apiRequest('/api/domains', { action: 'add', hostname });
                domainResult.textContent = \`Successfully added \${hostname}!\`;
                domainResult.className = 'mt-4 text-center text-green-600';
                domainForm.reset();
                loadDomains(); // Refresh the list
            } catch (error) {
                domainResult.textContent = \`Error: \${error.message}\`;
                domainResult.className = 'mt-4 text-center text-red-600';
            }
        });

    </script>
</body>
</html>
    `);
}
