# RapidLink — Self-Hosted URL Shortener & Paste Bin

A self-hosted URL shortener and paste bin built with React + Vite + Vercel serverless functions and Turso (libSQL) for storage.

## Features

- 🔗 Custom short links with optional password protection
- 📋 Markdown paste bin with expiry support
- 📊 Click analytics per link
- 🌐 Multi-domain support
- 🦊 Firefox extension (Desktop + Android)
- 🔒 Bearer token API for external app integration

---

## API Documentation

All protected endpoints require the `Authorization` header:

```
Authorization: Bearer <YOUR_DASHBOARD_PASSWORD>
```

Base URL: `https://<your-instance>.vercel.app`

---

### Authentication

#### `POST /api/login`

Login and receive an auth cookie (used by the web dashboard).

**Body:**
```json
{
  "password": "your_password",
  "rememberMe": true
}
```

**Response `200`:**
```json
{ "message": "Login successful." }
```
Sets an `auth_token` HTTP-only cookie.

**Response `401`:**
```json
{ "error": "Invalid password." }
```

> **Note:** External apps should skip this endpoint and use `Authorization: Bearer <password>` on every request instead.

---

### Links

#### `POST /api/shorten` 🔒

Create a short link.

**Body:**
```json
{
  "url": "https://example.com/very-long-article",
  "hostname": "short.example.com",
  "slug": "my-slug",
  "password": "optional-password"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `url` | ✅ | Destination URL |
| `hostname` | ✅ | Domain to use (from your configured domains) |
| `slug` | ❌ | Custom slug. Auto-generated if omitted |
| `password` | ❌ | Password-protect the link |

**Response `200`:**
```json
{ "shortUrl": "https://short.example.com/my-slug" }
```

**Errors:** `400` missing fields, `409` slug already taken.

---

#### `GET /api/links` 🔒

List all short links.

**Response `200`:**
```json
[
  {
    "slug": "my-slug",
    "url": "https://example.com/long-page",
    "hostname": "short.example.com",
    "password": null,
    "click_count": 42,
    "created_at": "2026-01-15T10:30:00.000Z"
  }
]
```

---

#### `PUT /api/links` 🔒

Update an existing link.

**Body:**
```json
{
  "originalSlug": "old-slug",
  "destinationUrl": "https://new-destination.com",
  "newSlug": "new-slug",
  "password": "new-password"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `originalSlug` | ✅ | Slug of the link to edit |
| `destinationUrl` | ✅ | New destination URL |
| `newSlug` | ❌ | New slug (defaults to original) |
| `password` | ❌ | New password. Omit to keep existing, `""` to remove |

**Response `200`:**
```json
{ "message": "Link updated successfully." }
```

---

#### `DELETE /api/links` 🔒

Delete a link.

**Body:**
```json
{ "slug": "my-slug" }
```

**Response `200`:**
```json
{ "message": "Link deleted successfully." }
```

---

#### `GET /api/link-details?slug=my-slug` 🔒

Get click analytics for a link.

**Response `200`:**
```json
[
  {
    "link_slug": "my-slug",
    "ip_address": "1.2.3.4",
    "user_agent": "Mozilla/5.0...",
    "referrer": "https://google.com",
    "clicked_at": "2026-01-16T14:20:00.000Z"
  }
]
```

---

### Pastes

#### `POST /api/create-paste` 🔒

Create a new paste.

**Body:**
```json
{
  "content": "# Hello World\nSome markdown content",
  "hostname": "short.example.com",
  "password": "optional",
  "expires": "1day"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `content` | ✅ | Paste content (markdown supported) |
| `hostname` | ✅ | Domain for the paste URL |
| `password` | ❌ | Password-protect the paste |
| `expires` | ❌ | Expiry: `never`, `1hour`, `1day`, `1week` |

**Response `200`:**
```json
{ "pasteUrl": "https://short.example.com/p/a1b2c3d4ef" }
```

---

#### `GET /api/pastes` 🔒

List all pastes with expiry status.

**Response `200`:**
```json
[
  {
    "slug": "a1b2c3d4ef",
    "hostname": "short.example.com",
    "hasPassword": false,
    "expiresAt": "2026-01-20T10:30:00.000Z",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "isExpired": false
  }
]
```

---

#### `DELETE /api/pastes` 🔒

Delete a paste.

**Body:**
```json
{ "slug": "a1b2c3d4ef" }
```

**Response `200`:**
```json
{ "message": "Paste deleted successfully." }
```

---

#### `GET /api/get-paste?slug=a1b2c3d4ef` 🌐 Public

Get paste content (no auth required).

**Response `200`:**
```json
{ "content": "# Hello World\nSome markdown content" }
```

**Errors:** `404` not found, `403` password protected, `410` expired.

---

### Domains

#### `GET /api/domains` 🔒

List configured domains.

**Response `200`:**
```json
[
  { "hostname": "short.example.com" },
  { "hostname": "link.example.com" }
]
```

---

#### `POST /api/add-domain` 🔒

Add a new domain.

**Body:**
```json
{ "hostname": "new.example.com" }
```

**Response `201`:**
```json
{ "message": "Domain added successfully." }
```

---

#### `DELETE /api/domains` 🔒

Delete a domain (cannot delete the last one).

**Body:**
```json
{ "hostname": "old.example.com" }
```

**Response `200`:**
```json
{ "message": "Domain deleted successfully." }
```

---

### Public Routes

#### `POST /api/verify-password` 🌐 Public

Verify a password-protected link and get the destination URL.

**Body:**
```json
{
  "slug": "protected-slug",
  "password": "the-password"
}
```

**Response `200`:**
```json
{ "destinationUrl": "https://example.com/secret-page" }
```

---

## Android Integration Example

```kotlin
// Kotlin example using OkHttp
val client = OkHttpClient()

fun shortenUrl(longUrl: String, callback: (String) -> Unit) {
    val json = JSONObject().apply {
        put("url", longUrl)
        put("hostname", "short.example.com")
    }

    val request = Request.Builder()
        .url("https://your-instance.vercel.app/api/shorten")
        .addHeader("Authorization", "Bearer YOUR_PASSWORD")
        .addHeader("Content-Type", "application/json")
        .post(json.toString().toRequestBody("application/json".toMediaType()))
        .build()

    client.newCall(request).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            val body = JSONObject(response.body?.string() ?: "")
            callback(body.getString("shortUrl"))
        }
        override fun onFailure(call: Call, e: IOException) {
            // Handle error
        }
    })
}
```

## Error Responses

All errors follow this format:
```json
{ "error": "Description of what went wrong." }
```

| Code | Meaning |
|------|---------|
| `400` | Missing required fields |
| `401` | Authentication failed |
| `403` | Password protected resource |
| `404` | Resource not found |
| `409` | Conflict (slug/domain already exists) |
| `410` | Resource expired |
| `500` | Server error |

---

## Setup

1. Fork and deploy to Vercel
2. Create a [Turso](https://turso.tech) database
3. Set environment variables:
   - `TURSO_DATABASE_URL` — Your Turso DB URL
   - `TURSO_AUTH_TOKEN` — Your Turso auth token
   - `DASHBOARD_PASSWORD` — Password for login & API auth
4. Add your domain in the dashboard