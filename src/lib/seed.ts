import type { InValue } from "@libsql/client";

type SeedCat = { id: string; name: string; slug: string; parentId: string | null; description: string; image: string | null };

export const SEED_CATEGORIES: SeedCat[] = [
  { id: "cat_wall", name: "Wall Decor", slug: "wall-decor", parentId: null, description: "Lippan art, mandalas and hand-painted pieces that turn walls into stories.", image: "/demo/photos/mirror-mandala.webp" },
  { id: "cat_lippan", name: "Lippan Art", slug: "lippan-art", parentId: "cat_wall", description: "Traditional Kutch mud-and-mirror work, hand-sculpted one mirror at a time.", image: "/demo/photos/peacock-lippan.webp" },
  { id: "cat_plates", name: "Wall Plates & Mandalas", slug: "wall-plates-mandalas", parentId: "cat_wall", description: "Decorative plates and mandalas in every colour.", image: "/demo/photos/lotus-wall-plate.webp" },
  { id: "cat_home", name: "Home Accents", slug: "home-accents", parentId: null, description: "Little handmade pieces – trays, frames, mirrors and more – for everyday joy.", image: "/demo/photos/jharokha-frame.webp" },
  { id: "cat_frames", name: "Mirrors & Frames", slug: "mirrors-frames", parentId: "cat_home", description: "Statement frames and mirror-work pieces.", image: "/demo/photos/jharokha-frame.webp" },
  { id: "cat_trays", name: "Trays & Coasters", slug: "trays-coasters", parentId: "cat_home", description: "Useful and beautiful – for serving, pooja and gifting.", image: "/demo/photos/diya-tray.webp" },
  { id: "cat_festive", name: "Festive & Pooja", slug: "festive-pooja", parentId: null, description: "Torans, diya trays and festive decor for every celebration.", image: "/demo/photos/terracotta-torans.webp" },
  { id: "cat_custom", name: "Custom & Personalised", slug: "custom-personalised", parentId: null, description: "Name plates, gifts and made-to-order pieces designed just for you.", image: "/demo/photos/name-plate.webp" },
  { id: "cat_nameplates", name: "Name Plates", slug: "name-plates", parentId: "cat_custom", description: "Hand-lettered name plates for your home.", image: "/demo/photos/name-plate.webp" },
];

type Demo = {
  name: string;
  cat: string;
  price: number;
  compare?: number;
  img: string;
  short: string;
  size: string;
  materials: string[];
  colors: string[];
  tags: string[];
  featured?: boolean;
  best?: boolean;
  badge?: string;
  custom?: boolean;
  mto?: boolean;
};

const DEMOS: Demo[] = [
  {
    name: "Midnight Mirror Mandala",
    cat: "cat_lippan",
    price: 2499,
    compare: 2999,
    img: "mirror-mandala",
    short: "A 12-inch navy lippan mandala with three rings of hand-set mirrors that sparkle in lamplight.",
    size: "12 inch (30 cm) diameter",
    materials: ["MDF base", "Clay", "Glass mirrors", "Acrylic paint"],
    colors: ["Navy", "Ivory"],
    tags: ["wall decor", "living room", "gift", "housewarming"],
    featured: true,
    best: true,
    badge: "Bestseller",
  },
  {
    name: "Peacock Teal Lippan Plate",
    cat: "cat_lippan",
    price: 1899,
    img: "peacock-lippan",
    short: "Teal and ivory lippan plate inspired by the peacock feather – calm, bright and festive.",
    size: "10 inch (25 cm) diameter",
    materials: ["MDF base", "Clay", "Glass mirrors"],
    colors: ["Teal", "Ivory"],
    tags: ["wall decor", "bedroom", "festive"],
    featured: true,
  },
  {
    name: "Terracotta Arch Toran",
    cat: "cat_festive",
    price: 1599,
    img: "terracotta-torans",
    short: "Jharokha-shaped terracotta arch with mirror petals – perfect beside your main door.",
    size: "14 x 12 inch",
    materials: ["MDF", "Clay", "Mirrors"],
    colors: ["Terracotta", "Cream"],
    tags: ["entrance", "festive", "diwali"],
    badge: "New",
  },
  {
    name: "Lotus Wine Wall Plate",
    cat: "cat_plates",
    price: 1299,
    compare: 1499,
    img: "lotus-wall-plate",
    short: "Deep wine lippan plate with a blooming lotus of mirrors and gold-tone dots.",
    size: "10 inch (25 cm) diameter",
    materials: ["MDF base", "Clay", "Mirrors", "Metallic paint"],
    colors: ["Wine", "Gold"],
    tags: ["pooja room", "gift", "wall decor"],
    best: true,
  },
  {
    name: "Jharokha Square Mirror Frame",
    cat: "cat_frames",
    price: 2199,
    img: "jharokha-frame",
    short: "A square heritage frame with mirror inlays – a statement piece for consoles and shelves.",
    size: "12 x 12 inch",
    materials: ["MDF", "Clay", "Mirrors"],
    colors: ["Navy", "Beige"],
    tags: ["console", "shelf decor", "living room"],
    featured: true,
  },
  {
    name: "Sunburst Mirror Wall Art",
    cat: "cat_lippan",
    price: 3499,
    compare: 3999,
    img: "sunburst-mirror",
    short: "Our largest piece – a golden sunburst with 72 hand-set mirrors. Pure happiness on a wall.",
    size: "18 inch (45 cm) diameter",
    materials: ["MDF base", "Clay", "Mirrors", "Acrylic paint"],
    colors: ["Mustard", "Navy"],
    tags: ["statement", "living room", "large"],
    featured: true,
    badge: "Limited",
  },
  {
    name: "Personalised Lippan Name Plate",
    cat: "cat_nameplates",
    price: 1799,
    img: "name-plate",
    short: "Your family name, hand-lettered and framed with lippan mirrors. Made to order in 7–10 days.",
    size: "15 x 8 inch",
    materials: ["MDF", "Clay", "Mirrors", "Weatherproof varnish"],
    colors: ["Navy", "Cream"],
    tags: ["name plate", "housewarming", "personalised", "gift"],
    best: true,
    custom: true,
    mto: true,
  },
  {
    name: "Festive Diya Tray",
    cat: "cat_trays",
    price: 899,
    img: "diya-tray",
    short: "A mirror-work tray for diyas, sweets or pooja thali – festive season's favourite.",
    size: "9 inch (23 cm) diameter",
    materials: ["MDF", "Clay", "Mirrors"],
    colors: ["Plum", "Ivory"],
    tags: ["diwali", "pooja", "gift", "tray"],
    badge: "Festive",
  },
];

export function seedDemoProducts(now: string): { sql: string; args: InValue[] }[] {
  return DEMOS.map((d, i) => {
    const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const description = `${d.short}\n\nEvery piece is handmade at our home studio – clay is shaped by hand, each mirror is pressed in individually and the details are painted with care. Because it is handmade, small variations make your piece truly one of a kind.\n\nReady to hang with a hook at the back.`;
    return {
      sql: `INSERT OR IGNORE INTO Product (id, slug, name, categoryId, price, compareAtPrice, images, shortDescription, description, size, materials, colors, tags, care, stock, madeToOrder, leadTimeDays, customizable, isActive, isFeatured, isBestseller, isDemo, badge, sortOrder, createdAt, updatedAt)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,1,?,?,?,?)`,
      args: [
        `demo_${i + 1}`,
        slug,
        d.name,
        d.cat,
        d.price,
        d.compare ?? null,
        JSON.stringify([`/demo/photos/${d.img}.webp`, `/demo/photos/${d.img}-detail.webp`]),
        d.short,
        description,
        d.size,
        JSON.stringify(d.materials),
        JSON.stringify(d.colors),
        JSON.stringify(d.tags),
        "Wipe gently with a dry, soft cloth. Keep away from water and direct harsh sunlight.",
        d.mto ? 0 : 3,
        d.mto ? 1 : 0,
        d.mto ? 10 : null,
        d.custom ? 1 : 0,
        d.featured ? 1 : 0,
        d.best ? 1 : 0,
        d.badge ?? null,
        i,
        now,
        now,
      ],
    };
  });
}
