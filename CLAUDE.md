@AGENTS.md

# Kavita's Artistry — guide for Claude Code

Online shop + studio admin for Kavita's handmade art & craft (Lippan art, wall decor, festive pieces,
custom orders). Customers order through **WhatsApp**: the order is saved, then WhatsApp opens pre-filled.
The owner is non-technical: explain in plain, step-by-step language, do as much
as possible yourself, and only ask them for things that need their accounts (Vercel, Turso, GitHub).

Read `docs/HANDOFF.md` for the full history, current status, owner preferences and pending tasks.

## Live
- Shop: https://kavita1.vercel.app · Admin: https://kavita1.vercel.app/admin
- GitHub: rahulkothari677/kavita1 — the only branch is `claude/awesome-johnson-bnzerf` and Vercel
  deploys it to production on every push. Commit and push there; there is no `main`.

## Stack
Next.js 16 App Router (params/searchParams are Promises; Middleware is now `src/proxy.ts`),
React 19, TypeScript, Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`), libSQL/Turso via
`@libsql/client` with raw SQL (no ORM), jose JWT cookie auth, Anthropic or Gemini for AI.

## Commands
- `npm install` · `npm run dev` (http://localhost:3000) · `npm run build` · `npm run lint` (= `tsc --noEmit`)
- Local data lives in `data/local.db` (git-ignored, auto-created with demo products). Delete it to reset.
- Admin locally: open /admin; the first visit asks you to create a password.

## Map
- `src/app/(store)/` — shop pages · `src/app/admin/(panel)/` — admin pages (client pages loading `/api/admin/*`)
- `src/app/api/` — route handlers (`handler()` from `lib/api.ts`, `requireAdmin()` from `lib/auth.ts`)
- `src/lib/db.ts` — client, schema (`SCHEMA`), one-time migrations behind `DB_VERSION`
  (bump it when adding a migration), and `run`/`batch` which clear the storefront cache on every write
- `src/lib/cached.ts` — cached storefront reads (`unstable_cache`, tag `store`). Shop pages import
  from here; admin and API code import from `lib/repo.ts` / `lib/settings.ts` directly
- `src/lib/repo.ts` — all queries · `src/lib/settings.ts` — store settings with defaults
- `src/lib/themes.ts` — colour themes (default `atelier`), picked in Admin → Settings → Appearance
- `src/components/store/home/Atelier.tsx` — homepage hero, category tiles, About strip
- `public/sw.js` + `src/app/manifest.ts` + `public/admin.webmanifest` — two installable apps (shop, Studio Admin)

## Rules that matter
- Never show fake reviews, sales counts or other made-up social proof.
- Cash on delivery only when the `codAvailable` setting is on.
- Keep plain `<img>` with `imgUrl()`/`responsiveImg()`; images may be Cloudinary, Vercel Blob or `/api/img/[id]`.
- Colours always via theme tokens (`bg-canvas`, `text-ink`, `bg-panel-a`, …), never hard-coded hex in components.
- Every text/background pair must pass WCAG AA; check new theme colours.
- Storefront type stays modest: products, not headlines, should dominate (owner feedback).
- Before pushing: `npm run lint` and `npm run build` must pass. After pushing, the GitHub Action
  "Live site check" (`scripts/live-check.mjs`) opens the live site on desktop + phone and reports problems;
  check it under the repo's Actions tab.
