# Handoff — where the project stands (Oct 2026)

Written for the owner and for any Claude Code session continuing the work (on a laptop or in the cloud).
`CLAUDE.md` has the short technical guide; this file has the history, decisions and open tasks.

## What has been built
- **Shop** (`/`): Warm Atelier design based on the owner's own mockup — golden-beige background, maroon
  handwriting-style titles (Dancing Script), olive/walnut category tiles, rounded photos, compact product cards.
  Homepage: hero banner → 6 category tiles → Featured Products → About Kavita strip → New Arrivals →
  The making → How ordering works → Commissions/gift finder → reviews.
  Plus shop with filters, product pages, search, quick view, wishlist, bag, checkout → WhatsApp,
  order tracking, custom orders, AI gift finder, AI shopping assistant "Kavi", About/FAQ/policies, photo credits.
- **Studio Admin** (`/admin`): dashboard, orders, products (Snap & Sell: add a product from a photo with AI),
  bulk upload, categories with sub-categories, reviews, custom requests, customers, coupons, content,
  settings (incl. 6+ colour themes with live preview), AI studio.
- **Two installable phone apps**: the shop (start `/`) and "Studio Admin" (start `/admin`, own icon).
- **Speed work**: loading screens on every page, cached shop data (cleared on every save), one database trip
  on start-up, service worker caching build files and photos.
- **Live check**: after every Vercel deploy a GitHub Action opens the live site on desktop and phone,
  clicks through everything and reports speed and problems (repo → Actions → "Live site check").

## Owner preferences (keep these)
- Premium, rich and warm, but **product-first**: no oversized headings or empty space.
- The logo is only for the name/mark; colours were chosen separately.
- No small "back to top" arrow. No top announcement strip (turned off; can be switched on in Admin → Content).
- No fake reviews or social proof. The owner checks the live site; don't send screenshots.
- Do as much as possible without the owner; give simple step-by-step instructions when their accounts are needed.

## Infrastructure
- Vercel project `rahul3021/kavita1`, production = branch `claude/awesome-johnson-bnzerf`.
- Database: Turso via the Vercel marketplace integration (env `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).
  `DATABASE_URL`/`DATABASE_AUTH_TOKEN` take priority if set.
- Today both the server (Vercel `iad1`, Washington) and the database (`aws-us-east-1`) are in the **USA**.
  `/api/health` reports the current regions and database speed.
- Admin login cookie is signed with `AUTH_SECRET`, or a secret derived from the database token
  (changing the database token logs the admin out once; the password is unchanged).

## Open tasks
1. **Move to Mumbai** (owner action needed). Steps are below.
2. **Separate admin app on Android**: if Chrome says "already installed", follow "Installing both apps" below.
3. Replace demo products with real ones (Admin → Products → Snap & Sell). Admin → Dashboard has a
   "remove demo products" option.
4. Optional: full-resolution versions of the mockup photos in `public/home/` (current ones are cropped
   from the mockup and slightly soft on large screens).

## Installing both apps
- Admin web address `kavita1-admin.vercel.app` is added in Vercel (Oct 21). Its home page opens the admin.
- The live check confirms Chrome finds both apps installable (shop on kavita1.vercel.app, admin on
  kavita1-admin.vercel.app) with no errors.
- Each app has an **Install** button: shop → footer "Install our app"; admin → sidebar / More menu
  "Install admin app". If the browser doesn't offer installation, the button explains why.
- Chrome says "already installed" when an older Kavita's app is still on the device: remove it first
  (Windows: open the app → ⋮ menu → Uninstall, or chrome://apps → right-click → Remove; Android: long-press
  the icon → Uninstall), then reload the page and tap Install again.
- Install the admin from `kavita1-admin.vercel.app`, never from `kavita1.vercel.app/admin`.

## Move to Mumbai (faster for India) — optional
Not urgent: the server answers in ~0.05–0.1 s; what's left is the India ↔ USA distance (~0.2 s per page).
If the owner wants it, the Claude Code session does the technical steps (step 4: run the copy command
for them; step 7: or push `"regions": ["bom1"]` in vercel.json). The owner only creates the database,
copies two values from Turso, and adds two settings in Vercel. Turso's free plan may limit locations;
check in the Turso dashboard before starting.
Do the database and the server together, so they stay next to each other.

1. **Create the new database.** Vercel → **Storage** → your Turso database → **Open in Turso** (this logs you
   in to the Turso dashboard). There: **Groups** → **Create group** → location **Mumbai (aws-ap-south-1)**.
   Then **Databases** → **Create database** → name `kavitas-mumbai` → pick the Mumbai group → Create.
2. **Get its address and token.** Open the new database → copy the **URL** (`libsql://kavitas-mumbai-....turso.io`)
   → **Create token** (full access, no expiry) → copy it.
3. **Get the old database's address and token.** Vercel → project kavita1 → Settings → Environment Variables →
   reveal `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
4. **Copy the data** (on the laptop, inside the project folder). Create a file named `.env.copy.local`
   (git-ignored) with:
   ```
   FROM_URL=<old TURSO_DATABASE_URL>
   FROM_TOKEN=<old TURSO_AUTH_TOKEN>
   TO_URL=<new Mumbai URL>
   TO_TOKEN=<new Mumbai token>
   ```
   then run `node --env-file=.env.copy.local scripts/copy-db.mjs`. It copies every table and checks
   the row counts. The old database is only read, so nothing is lost if anything goes wrong.
5. **Point the site at the new database.** Vercel → Settings → Environment Variables → add
   `DATABASE_URL` = new URL and `DATABASE_AUTH_TOKEN` = new token (Production, Preview and Development).
   These take priority over the TURSO_* ones, so the integration can stay as it is.
6. **Move the server.** Vercel → Settings → **Functions** → Function Region → **Mumbai, India (bom1)** → Save.
7. **Redeploy.** Vercel → Deployments → latest → ⋯ → **Redeploy**.
8. **Check.** Open `https://kavita1.vercel.app/api/health`. It should show `"serverRegion":"bom1"` and
   `"dbRegion":"aws-ap-south-1"`. Log in to the admin again (one-time) and check that orders and products are there.
   Keep the old database for a couple of weeks before deleting it.

## Working on the laptop
1. Install **Node.js 22 LTS** (https://nodejs.org) and **Git** (https://git-scm.com). On Windows, use the default options.
2. Open a terminal (Windows: "Terminal" or "PowerShell"; Mac: "Terminal") and run:
   ```
   git clone https://github.com/rahulkothari677/kavita1.git
   cd kavita1
   git checkout claude/awesome-johnson-bnzerf
   npm install
   npm run dev
   ```
   Open http://localhost:3000. Local data is a separate practice database with demo products, so nothing
   you do locally changes the live shop. Stop with Ctrl+C.
3. Install Claude Code: `npm install -g @anthropic-ai/claude-code`, then run `claude` inside the `kavita1`
   folder and log in. It reads `CLAUDE.md` and this file automatically.
4. To publish changes: ask Claude Code to commit and push. Vercel deploys within a couple of minutes,
   and the live check runs after it.
5. Optional: copy `.env.example` to `.env.local` and add an AI key (`ANTHROPIC_API_KEY` or `GEMINI_API_KEY`)
   to try the AI features locally. Don't put the live database there unless you mean to edit live data.
