# AI Handoff

## Project Snapshot

RapidLink is a self-hosted URL shortener and paste bin. The current app is a React 18 + Vite frontend backed by Vercel serverless functions and Turso/libSQL.

Primary user flows:
- Authenticated dashboard at `/dashboard`
- Create, filter, edit, copy, delete, and inspect short links
- Create markdown pastes with optional password and expiry
- View paste pages at `/p/:slug`
- Unlock password-protected short links through `/password`

Backend API behavior was not changed in this redesign.

## Redesign Summary

The frontend has been redesigned around `questui-DESIGN.md`, replacing the previous Midnight Ocean glass UI with a QuestUI-inspired fantasy interface.

Implemented design direction:
- Dark brown layered background: `#1A0F0A`, `#2C1A10`, `#3D2517`
- Gold primary actions and highlights: `#CA8A04`
- Deep red destructive/error state: `#991B1B`
- Royal purple secondary accent for special/supportive panels
- Parchment text instead of pure white: `#F5E6D3`
- Serif typography using Cinzel for headings/UI labels, Spectral for body, and Fira Code for code
- Angular radii aligned to QuestUI specs, with cards and controls kept at 8px or less
- Ornate borders, top accents, and gold glow shadows for important surfaces
- Static textured background replacing decorative glow-orb treatments

## Key Files Changed

- `questui-DESIGN.md`
  - Source design spec added to the repo.

- `index.html`
  - Swapped Google Fonts from Inter to Cinzel, Spectral, and Fira Code.
  - Updated page title for the redesigned experience.

- `tailwind.config.js`
  - Added QuestUI color tokens under `quest`.
  - Added serif and mono font families.
  - Constrained border radii to the QuestUI scale.
  - Added gold glow shadows.
  - Kept compatibility aliases for older ocean/cyan utility names so old classes do not visually regress if they remain in future work.

- `src/index.css`
  - Rebuilt the base theme, shared card/input/button classes, scrollbars, markdown paste styling, and background texture.
  - Added reusable QuestUI helpers: `.quest-icon`, `.quest-row`, `.quest-chip`, `.quest-prose`.

- `src/components/ui/*`
  - Updated shared Button, Input, Select, Card, and Modal styling to QuestUI.

- `src/components/Layout.tsx`
  - Reworked the shell and navbar to use QuestUI navigation styling.
  - Removed the prior decorative background blobs.

- `src/pages/*` and `src/components/dashboard/*`
  - Updated dashboard, login, password prompt, analytics, paste viewer, forms, lists, action buttons, and empty/loading states to use QuestUI styling.

## Implementation Notes

- The redesign is intentionally frontend-only. No API contracts, database calls, auth behavior, routes, or data models were changed.
- Existing component names like `GlassCard` remain for API stability, but the visual implementation now renders QuestUI cards.
- The dashboard remains utility-first and usable on mobile. The list/table split for links and the paste list interaction model are unchanged.
- The markdown paste viewer no longer depends on Tailwind typography plugin classes. It now uses local `.quest-prose` CSS.

## Follow-Up Considerations

- `agents.md` still describes older static frontend paths and should be refreshed in a future documentation pass.
- The Firefox extension keeps its existing styling and was not part of this redesign.
- If the project wants completely semantic Tailwind names later, remaining compatibility aliases like `ocean` can be removed after confirming no downstream usage.

## Validation

Local verification was skipped per user instruction on May 10, 2026. An earlier `npm run build` attempt did not reach code validation because the local `node_modules` install is missing `.bin/tsc`; no package-lock or dependency changes were produced.
