# Kavita's Artistry — Handmade with love

A premium storefront + studio admin for selling handmade art & craft, with **ordering on WhatsApp** and **AI built in**.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, Turso (libSQL) and Gemini / Claude.

---

## ✨ What's inside

### Storefront (for customers)
- Editorial, mobile-first design based on the Kavita's Artistry brand (navy, cream, mirror-work motifs)
- Home: hero slider, shop by category, featured & new pieces, "The making" story, custom-order & gift CTAs, testimonials
- **Categories with sub-categories**, filters (price, availability), sorting
- **Predictive search** with instant results, recent & popular searches
- Product pages: zoomable gallery, personalisation note, stock / made-to-order status, reviews, related & recently-viewed items, sticky buy bar on mobile, SEO structured data
- Quick view, wishlist (shareable on WhatsApp), slide-out bag with "pairs well with" suggestions, free-shipping progress
- **Checkout → WhatsApp**: order is saved, then WhatsApp opens with the full order pre-filled. Offer codes, gift wrap + handwritten card message
- Order tracking page with a visual timeline
- Custom order page with an **AI design-brief helper**
- **AI Gift Finder** (occasion → recipient → budget → picks with reasons)
- **AI shopping assistant "Kavi"** that knows the catalogue and recommends real products
- About, FAQ (Google rich results), shipping/returns/care pages, sitemap, robots, PWA manifest
- App-style bottom navigation on phones

### Studio Admin (`/admin`) — works great on a phone
- **Dashboard**: revenue & orders (7/30/90 days), what needs attention, best sellers, most viewed, low stock, **AI business coach**
- **Snap & Sell**: take a photo → AI writes the name, story, tags, colours, size estimate, SEO, Instagram caption and suggests a price
- **Bulk upload**: drop many photos → AI creates a listing for each → publish all
- Products: search/filter, inline price & stock editing, live/featured toggles, duplicate, **bulk actions** (publish, hide, feature, move category, change prices by %)
- **Categories & sub-categories**: add, rename, nest, reorder, hide, cover images
- Orders: status pipeline, payment tracking, courier & tracking no., one-tap **WhatsApp templates** (confirm + UPI, payment received, being made, shipped, ask for review), **AI personal messages**, printable invoice, CSV export, add orders received directly on WhatsApp/Instagram
- Stock is reduced automatically when an order is confirmed and restored when cancelled
- Custom requests inbox with quotes, customers list (repeat / VIP / lapsed segments, CSV export), reviews moderation & testimonials
- Offers & marketing: discount codes, subscriber list, **AI campaign planner** (WhatsApp broadcast + Instagram post + reel ideas)
- **AI Studio**: caption writer (Instagram / WhatsApp status, English / Hindi / Hinglish / Gujarati…), customer-reply helper
- Website content editor: announcement bar, hero slides, about story & photo, FAQs, policies
- Settings: WhatsApp number, UPI ID, shipping & gift-wrap charges, holiday mode, AI assistant, password, system status

---

## 🚀 Deploy to Vercel (about 10 minutes)

1. **Create a free database** at [turso.tech](https://turso.tech) → *Create database* → copy the **Database URL** (`libsql://…`) and create a **token**.
2. **Get a free AI key** at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (Gemini). *(Or use an Anthropic key.)*
3. *(Recommended)* **Image hosting**: free [Cloudinary](https://cloudinary.com) account → copy Cloud name, API key, API secret. *(Or in Vercel: Storage → Create Blob store. Or skip — images are stored in the database.)*
4. Go to [vercel.com/new](https://vercel.com/new) → **Import** the `kavita1` GitHub repository.
5. Before clicking Deploy, open **Environment Variables** and add (see `.env.example`):
   - `DATABASE_URL`, `DATABASE_AUTH_TOKEN`
   - `GEMINI_API_KEY`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (optional)
   - `AUTH_SECRET` (any long random text)
   - `NEXT_PUBLIC_SITE_URL` (your domain, once you have one)
6. Click **Deploy**. Open `https://your-site.vercel.app/admin` → create your admin password.
7. In **Admin → Settings** set your **WhatsApp number** and **UPI ID**. Then add your products and remove the demo ones.

Custom domain: Vercel → Project → Settings → Domains.

## 💻 Run locally

```bash
npm install
cp .env.example .env.local   # optional — works without any keys using a local database
npm run dev                  # http://localhost:3000  (admin: /admin)
```

Without `DATABASE_URL` a local SQLite file is created in `./data/`. Without an AI key, AI features fall back gracefully.

## 🗂 Project structure

```
src/app/(store)/      customer-facing pages
src/app/admin/        studio admin (login, dashboard, products, orders, …)
src/app/api/          API routes (public + /api/admin/*)
src/components/       store & admin UI
src/lib/              database, repositories, AI, WhatsApp, settings, auth
scripts/              demo artwork generator
```
