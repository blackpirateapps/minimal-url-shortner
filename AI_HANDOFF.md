# AI Handoff

## Project Snapshot

RapidLink is a self-hosted URL shortener and paste bin. The current app is a React 18 + Vite frontend backed by Vercel serverless functions and Turso/libSQL.

Primary user flows:
- Authenticated dashboard at `/dashboard`
- Create, filter, edit, copy, delete, and inspect short links
- Create markdown pastes with optional password and expiry
- View paste pages at `/p/:slug`
- Unlock password-protected short links and pastes through `/password`

## Redesign & Recent Backend Updates

### Password Protection & API Updates (July 2026)
- **Redirect Fix**: Fixed `api/redirect.js` redirect target from legacy `/password.html` to `/password`.
- **Query/Header Unlock**: Added direct password validation via `?password=...` query param or `x-link-password` header in `api/redirect.js`, `api/_paste_handlers.js`, and `api/view.js`.
- **Dual Verification API**: Enhanced `POST /api/verify-password` to check `links` table first and fallback to `pastes` table, returning destination URL for links or markdown content for pastes.
- **Security & Response Sanitization**: Updated `GET /api/links` and `POST /api/shorten` to return `hasPassword` booleans and sanitized password indicators instead of leaking raw bcrypt hashes.
- **Frontend Prompt Rewrite**: Completely rewrote `src/pages/PasswordPrompt.tsx` with show/hide password toggle, auto-focus, error notification boxes, and seamless display for unlocked paste content. Removed obsolete `public_legacy/password.html`.
- **Documentation Alignment**: Updated `agents.md` to reflect `/password` routing instead of `.html` legacy paths.

### Visual Redesign Summary (QuestUI)
The frontend redesign uses `questui-DESIGN.md`:
- Dark brown layered background: `#1A0F0A`, `#2C1A10`, `#3D2517`
- Gold primary actions and highlights: `#CA8A04`
- Deep red destructive/error state: `#991B1B`
- Royal purple secondary accent for special/supportive panels
- Parchment text instead of pure white: `#F5E6D3`
- Serif typography using Cinzel for headings/UI labels, Spectral for body, and Fira Code for code

## Key Files Modified in Recent Updates

- `api/redirect.js`
  - Fixed `/password.html` -> `/password` redirect bug; added `bcrypt` query/header verification.
- `api/_handlers.js`
  - Enhanced `handleVerifyPassword` for links & pastes; sanitized `handleGetLinks`; added `hasPassword` flag to `handleShortenUrl`.
- `api/_paste_handlers.js` & `api/view.js`
  - Added optional password verification via query params and headers; redirected protected pastes to `/password`.
- `src/pages/PasswordPrompt.tsx`
  - Rewrote component with show/hide password, error handling, auto-focus, and unlocked content display.
- `src/pages/PasteView.tsx`
  - Redirects password protected (403) pastes directly to `/password?slug=${slug}`.
- `agents.md` & `AI_HANDOFF.md`
  - Refreshed system documentation.
- Deleted `public_legacy/password.html`.

## Validation

- Verified build locally using `npm run build` (`tsc -b && vite build`), which completed with zero compilation errors.
