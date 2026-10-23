import { query, run } from "./db";
import type { StoreSettings } from "./types";

export const DEFAULT_SETTINGS: StoreSettings = {
  theme: "atelier",
  titleFont: "",
  bodyFont: "",
  backgroundPattern: false,
  storeName: "Kavita's Artistry",
  tagline: "Handmade with love",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999",
  phone: "",
  email: "",
  instagram: "",
  facebook: "",
  youtube: "",
  address: "India",
  currencySymbol: "₹",
  shippingFee: 99,
  freeShippingAbove: 1999,
  giftWrapFee: 49,
  codAvailable: false,
  upiId: "",
  orderNote: "Every piece is handmade, so please allow 3–7 days for dispatch.",
  announcement: "✨ Free shipping on orders above ₹1999 · Custom orders open — message us on WhatsApp",
  announcementActive: false,
  acceptingOrders: true,
  vacationMessage: "We're taking a short creative break. Orders placed now will be dispatched once we're back!",
  heroSlides: [
    {
      id: "h1",
      eyebrow: "Handmade Art · Craft · Decor",
      title: "Art that adds happiness to your space",
      subtitle:
        "Lippan art, wall decor, festive pieces and personalised gifts — made slowly by hand at our home studio, one piece at a time.",
      image: "",
      ctaLabel: "Explore the collection",
      ctaLink: "/shop",
    },
  ],
  aboutTitle: "Hi, I'm Kavita",
  aboutStory:
    "What started as a weekend hobby on our dining table became Kavita's Artistry — a small home studio where every piece is shaped, pressed and painted by hand.\n\nI love working with my hands — clay, mirrors, colours, threads and wood. From traditional Lippan art from Kutch to festive decor and personalised gifts, every piece is something I would happily hang in my own home.\n\nEvery order is made with patience, packed with care and sent with a little handwritten note. Thank you for supporting handmade.",
  artistName: "Kavita",
  artistImage: "",
  aboutPageImage: "",
  homeTiles: [
    { title: "Lippan Art", text: "Traditional art, modern homes", image: "/home/tile-lippan.webp", link: "/shop?category=lippan-art" },
    { title: "Home Decor", text: "Add charm to your spaces", image: "/home/tile-decor.webp", link: "/shop?category=home-accents" },
    { title: "Wall Hangings & Mirrors", text: "For walls that tell a story", image: "/home/tile-hangings.webp", link: "/shop?category=wall-decor" },
    { title: "Customised Creations", text: "Your idea, my art", image: "/home/tile-custom.webp", link: "/custom-order" },
    { title: "Bestsellers", text: "Loved by many, crafted with care", image: "/home/tile-bestsellers.webp", link: "/shop?sort=popular" },
    { title: "New Arrivals", text: "Fresh designs, just for you", image: "/home/tile-new.webp", link: "/shop?sort=newest" },
  ],
  makingSteps: [
    { title: "Sketch", body: "Every design begins as a pencil drawing, sized to your wall.", image: "/stock/making-painting.webp" },
    { title: "Shape", body: "Clay is rolled and pressed by hand into borders, petals and dots.", image: "/stock/making-potter-hands.webp" },
    { title: "Paint", body: "Mirrors are set one by one and colour goes on in slow layers.", image: "/stock/making-painting-ceramics.webp" },
    { title: "Finish & pack", body: "A last touch, a signature, then wrapped with care for you.", image: "/stock/making-embroidery.webp" },
  ],
  commissionImage: "",
  shareImage: "",
  faqs: [
    {
      q: "How do I place an order?",
      a: "Add pieces to your bag and tap “Order on WhatsApp”. Your order details are sent to us on WhatsApp, we confirm availability and share payment details. Simple!",
    },
    {
      q: "Do you take custom orders?",
      a: "Yes! Name plates, colour changes, sizes and fully custom designs. Use the Custom Order page or message us on WhatsApp with your idea.",
    },
    {
      q: "How long does delivery take?",
      a: "Ready pieces ship in 2–4 days. Made-to-order pieces take 7–12 days to create. Delivery across India usually takes 3–7 days after dispatch.",
    },
    {
      q: "How do I pay?",
      a: "Once we confirm your order on WhatsApp, you can pay via UPI or bank transfer. We'll share the details with you.",
    },
    {
      q: "Are the pieces fragile?",
      a: "Most pieces are sturdy for display, but some (like Lippan art) contain real glass mirrors, so please avoid dropping it or exposing it to water. We pack every piece with bubble wrap and corner protection.",
    },
  ],
  shippingPolicy:
    "We ship across India through trusted courier partners. Ready pieces are dispatched within 2–4 working days; made-to-order pieces within 7–12 days. You'll receive tracking details on WhatsApp once your order ships.",
  returnPolicy:
    "Because every piece is handmade, we do not accept returns for change of mind. If your piece arrives damaged, please send us an unboxing video on WhatsApp within 48 hours and we'll repair, replace or refund it.",
  careGuide:
    "Dust gently with a soft dry cloth or a makeup brush. Keep away from water, humidity and harsh direct sunlight. Hang with a sturdy nail or hook.",
  aiAssistantEnabled: true,
  aiAssistantName: "Kavi",
  seoDescription:
    "Handmade art & craft by Kavita's Artistry — Lippan art, wall decor, festive & pooja decor, name plates, gifts and custom creations. Order easily on WhatsApp.",
};

const PRIVATE_KEYS = new Set(["adminPasswordHash", "authSecret", "seeded", "demoV2", "themeV3", "dbVersion", "announcementOffV4"]);

export async function getSettings(): Promise<StoreSettings> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM Setting");
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (PRIVATE_KEYS.has(r.key)) continue;
    if (!(r.key in DEFAULT_SETTINGS)) continue;
    try {
      out[r.key] = JSON.parse(r.value);
    } catch {}
  }
  return out as StoreSettings;
}

export async function saveSettings(patch: Partial<StoreSettings>) {
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in DEFAULT_SETTINGS)) continue;
    await run("INSERT INTO Setting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [
      key,
      JSON.stringify(value),
    ]);
  }
}

export async function getPrivate(key: string): Promise<string | null> {
  const rows = await query<{ value: string }>("SELECT value FROM Setting WHERE key = ?", [key]);
  if (!rows[0]) return null;
  try {
    return JSON.parse(rows[0].value);
  } catch {
    return null;
  }
}

export async function setPrivate(key: string, value: string) {
  await run("INSERT INTO Setting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [
    key,
    JSON.stringify(value),
  ]);
}
