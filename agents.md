# Minimal URL Shortener - Agent Documentation

> A full-featured URL shortener and Pastebin service built with Vercel Functions and Turso DB.

## Project Overview

This is a serverless URL shortener application deployed on Vercel. It provides:
- **URL Shortening** with custom slugs and password protection
- **Pastebin functionality** with Markdown rendering and expiration
- **Multi-domain support** for white-labeling
- **Click analytics** with IP, user agent, and referrer tracking
- **Dashboard** with authentication, dark mode, and CRUD operations

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Vercel Serverless Functions (Node.js, ESM) |
| **Database** | [Turso](https://turso.tech/) (libSQL/SQLite edge database) |
| **Auth** | JWT tokens via `jsonwebtoken`, bcrypt password hashing |
| **Frontend** | Static HTML + TailwindCSS (CDN) |
| **Routing** | Vercel rewrites (`vercel.json`) |

---

## Directory Structure

```
minimal-url-shortner/
├── api/                    # Serverless backend
│   ├── _db.js              # Turso database client singleton
│   ├── _handlers.js        # URL shortener API handlers
│   ├── _paste_handlers.js  # Pastebin API handlers
│   ├── index.js            # Main API router with auth
│   ├── redirect.js         # Short URL redirect handler
│   └── view.js             # Server-rendered paste viewer
├── public/                 # Static frontend
│   ├── index.html          # Main dashboard (login + management)
│   ├── dasboard.html       # Legacy simple form (unused?)
│   ├── details.html        # Link analytics page
│   ├── password.html       # Password prompt for protected links
│   └── paste.html          # Client-side paste viewer
├── package.json
├── vercel.json             # Vercel routing configuration
└── README.md
```

---

## Database Schema

The application uses **3 tables**:

### `links` - URL Shortener Data
| Column | Type | Description |
|--------|------|-------------|
| `slug` | TEXT PRIMARY KEY | Short URL identifier |
| `url` | TEXT | Destination URL |
| `hostname` | TEXT | Domain for the short link |
| `password` | TEXT | bcrypt hash (nullable) |
| `click_count` | INTEGER | Aggregated click counter |
| `created_at` | DATETIME | Timestamp |

### `clicks` - Analytics Data
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `link_slug` | TEXT | Foreign key to links |
| `ip_address` | TEXT | Visitor IP |
| `user_agent` | TEXT | Browser info |
| `referrer` | TEXT | Source URL |
| `clicked_at` | DATETIME | Timestamp |

### `pastes` - Pastebin Data
| Column | Type | Description |
|--------|------|-------------|
| `slug` | TEXT PRIMARY KEY | Paste identifier |
| `content` | TEXT | Markdown content |
| `hostname` | TEXT | Domain for the paste link |
| `password` | TEXT | bcrypt hash (nullable) |
| `expires_at` | DATETIME | Auto-delete timestamp (nullable) |

### `domains` - Multi-Domain Support
| Column | Type | Description |
|--------|------|-------------|
| `hostname` | TEXT PRIMARY KEY | Domain name |
| `added_at` | DATETIME | Timestamp |

---

## API Endpoints

### Public Routes (No Auth)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/login` | Authenticate with dashboard password |
| `POST` | `/api/verify-password` | Verify password for protected links |
| `GET` | `/api/get-paste?slug=` | Retrieve paste content |

### Protected Routes (Requires Auth)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/shorten` | Create short URL |
| `GET` | `/api/links` | List all links |
| `PUT` | `/api/links` | Update a link |
| `DELETE` | `/api/links` | Delete a link |
| `GET` | `/api/link-details?slug=` | Get click analytics |
| `GET` | `/api/domains` | List all domains |
| `POST` | `/api/add-domain` | Add a domain |
| `DELETE` | `/api/domains` | Delete a domain |
| `POST` | `/api/create-paste` | Create a paste |

### Authentication Methods

1. **Cookie Auth (Dashboard)**: JWT in `auth_token` HttpOnly cookie
2. **Bearer Token (API/Plugins)**: `Authorization: Bearer <DASHBOARD_PASSWORD>`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | Turso database connection URL |
| `TURSO_AUTH_TOKEN` | Turso authentication token |
| `DASHBOARD_PASSWORD` | Master password for dashboard access (also used as JWT secret) |

---

## Routing (vercel.json)

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index.js" },
    { "source": "/p/:slug", "destination": "/paste.html" },
    { "source": "/:slug((?!api/|favicon.ico|p/).*)", "destination": "/api/redirect.js?slug=:slug" }
  ]
}
```

- `/api/*` → Main API handler
- `/p/<slug>` → Paste viewer (client-side)
- `/<slug>` → Short URL redirect (catch-all)

---

## Key Implementation Details

### Short URL Flow
1. User visits `https://domain.com/xyz123`
2. `vercel.json` rewrite sends to `/api/redirect.js?slug=xyz123`
3. `redirect.js` looks up slug in database
4. If password protected → redirect to `/password.html?slug=xyz123`
5. Otherwise → log click analytics → 308 redirect to destination

### Password Protection
- Passwords are hashed with bcrypt (10 salt rounds)
- Protected links redirect to `/password.html`
- Password verification happens via `/api/verify-password`
- Click analytics logged only after successful verification

### Paste System
- Pastes support Markdown content
- Auto-expiration: 1 hour, 1 day, 1 week, or never
- Expired pastes are deleted on access
- Two viewers: server-rendered (`/api/view.js`) and client-side (`/p/<slug>`)

### Analytics Tracking
- IP address (`x-forwarded-for` or socket address)
- User Agent
- Referrer
- Timestamp
- Both per-click logging and aggregate counter

---

## Development

```bash
# Install dependencies
npm install

# Run locally with Vercel CLI
npm run start
# or
vercel dev
```

---

## Common Tasks

### Adding a New API Endpoint
1. Create handler function in `api/_handlers.js` or `api/_paste_handlers.js`
2. Import and route it in `api/index.js` under protected or public routes
3. Test with `vercel dev`

### Adding a New Database Table
1. Run migration in Turso Shell:
   ```sql
   CREATE TABLE new_table (...);
   ```
2. Add corresponding handlers and UI

### Modifying the Dashboard UI
- Main dashboard is `/public/index.html`
- Uses TailwindCSS via CDN
- All JavaScript is inline in `<script>` tags
- Dark mode supported via `localStorage.theme`

---

## Security Considerations

- Dashboard password is used as JWT secret (consider separate secret)
- CORS is set to `*` for Obsidian plugin compatibility
- No CSRF protection on API endpoints
- HttpOnly cookies with `sameSite: strict`
- Passwords are bcrypt hashed

---

## Known Issues / TODOs

- [ ] `dasboard.html` appears to be legacy/unused (typo in filename)
- [ ] Paste password protection returns 403 without unlock flow
- [ ] No rate limiting on API endpoints
- [ ] No admin functionality to manage pastes
- [ ] Consider adding link expiration feature

---

## Integration Points

### Obsidian Plugin
The API supports Bearer token auth for external integrations:
```javascript
fetch('/api/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_DASHBOARD_PASSWORD'
  },
  body: JSON.stringify({ url: '...', hostname: '...' })
});
```

---

*Last updated: February 2026*
