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

// ─── Demo catalogue v2: real photographs (openly licensed — see src/lib/credits.ts) ─────────────

export const SEED_CATEGORIES_V2: SeedCat[] = [
  { id: "cat_paintings", name: "Paintings", slug: "paintings", parentId: "cat_wall", description: "Hand-painted folk art — Madhubani, mandalas and more.", image: "/stock/madhubani-fish-painting.webp" },
  { id: "cat_macrame", name: "Macramé & Fibre", slug: "macrame-fibre", parentId: "cat_home", description: "Hand-knotted cotton pieces with a soft, bohemian calm.", image: "/stock/macrame-dreamcatcher.webp" },
  { id: "cat_pottery", name: "Pottery & Terracotta", slug: "pottery-terracotta", parentId: "cat_home", description: "Wheel-thrown, sun-dried and hand-painted clay.", image: "/stock/painted-lamp-shades.webp" },
  { id: "cat_diyas", name: "Diyas & Pooja", slug: "diyas-pooja", parentId: "cat_festive", description: "Hand-painted diyas, aarti thalis and pooja pieces.", image: "/stock/painted-diyas.webp" },
  { id: "cat_textile", name: "Embroidery & Torans", slug: "embroidery-torans", parentId: "cat_festive", description: "Kutch mirror-work embroidery, torans and wall panels.", image: "/stock/kutch-mirror-toran.webp" },
];

type DemoV2 = {
  id: string;
  name: string;
  cat: string;
  price: number;
  compare?: number;
  images: string[];
  short: string;
  description: string;
  size: string;
  materials: string[];
  colors: string[];
  tags: string[];
  care: string;
  stock: number;
  mto?: number;
  featured?: boolean;
  best?: boolean;
  badge?: string;
  custom?: boolean;
};

const DEMOS_V2: DemoV2[] = [
  {
    id: "demo_9",
    name: "Golden Sun Lippan Mandala",
    cat: "cat_lippan",
    price: 2999,
    compare: 3499,
    images: ["/stock/lippan-sun-mandala.webp"],
    short: "A radiant ochre sun of mud relief and tiny mirrors, inspired by the bhunga homes of Kutch.",
    description:
      "A sunburst of hand-rolled clay petals and dots on a warm ochre ground, studded with mirrors that catch every lamp in the room.\n\nEach petal is shaped by hand and each mirror is pressed in one at a time, so no two suns are ever the same.\n\nBeautiful above a console, in an entryway or as the heart of a festive wall.",
    size: "20 inch (50 cm) diameter",
    materials: ["Clay", "Glass mirrors", "MDF base", "Acrylic paint"],
    colors: ["Ochre", "Gold"],
    tags: ["lippan", "mirror work", "wall decor", "living room", "housewarming", "kutch"],
    care: "Dust gently with a soft dry brush. Keep away from water.",
    stock: 2,
    featured: true,
    best: true,
    badge: "Bestseller",
  },
  {
    id: "demo_10",
    name: "Ivory Macramé Dreamcatcher",
    cat: "cat_macrame",
    price: 1499,
    images: ["/stock/macrame-dreamcatcher.webp"],
    short: "A hand-knotted cotton ring with a waterfall of soft fringe — calm, airy, endlessly giftable.",
    description:
      "Knotted by hand from soft natural cotton cord on a metal ring, with a long brushed fringe that moves gently with the breeze.\n\nIt brings a quiet, bohemian softness to bedrooms, reading corners and nurseries.\n\nWe can make it in other sizes or cord colours on request.",
    size: "Ring 16 inch (40 cm), total length about 30 inch (75 cm)",
    materials: ["Cotton cord", "Metal ring"],
    colors: ["Ivory"],
    tags: ["macrame", "boho", "bedroom", "nursery", "gift", "wall hanging"],
    care: "Shake gently to dust. Comb the fringe with fingers if it tangles.",
    stock: 4,
    custom: true,
    badge: "New",
  },
  {
    id: "demo_11",
    name: "Madhubani Fish & Lotus Painting",
    cat: "cat_paintings",
    price: 3200,
    images: ["/stock/madhubani-fish-painting.webp"],
    short: "A joyful Mithila-style painting — twin fish for good fortune, ringed by lotus and leaf borders.",
    description:
      "Painted entirely by hand in the Madhubani tradition, with fine bamboo-nib linework and bold natural colours.\n\nIn Mithila art the fish stands for fertility and good luck, which makes this a beloved wedding and housewarming gift.\n\nArrives ready to frame.",
    size: "12 × 16 inch (30 × 40 cm), on handmade paper",
    materials: ["Handmade paper", "Natural & acrylic colours"],
    colors: ["Yellow", "Red", "Blue", "Green"],
    tags: ["madhubani", "painting", "folk art", "wedding gift", "housewarming"],
    care: "Frame behind glass and keep out of direct sunlight.",
    stock: 1,
    featured: true,
  },
  {
    id: "demo_12",
    name: "Kutch Mirror-Work Toran",
    cat: "cat_textile",
    price: 2400,
    images: ["/stock/kutch-mirror-toran.webp", "/stock/kutch-embroidery-detail.webp"],
    short: "A festive door hanging embroidered with tiny mirrors and tasselled tabs, in the Saurashtra tradition.",
    description:
      "Densely embroidered by hand with chain stitch and shisha mirror work, finished with hanging tabs that sway when the door opens.\n\nHang it above your main door or pooja room for festivals, weddings and griha pravesh.\n\nInspired by traditional Saurashtra torans.",
    size: "24 × 28 inch (60 × 70 cm)",
    materials: ["Cotton", "Embroidery thread", "Glass mirrors"],
    colors: ["Rust", "Pink", "Green", "Mustard"],
    tags: ["toran", "kutch", "mirror work", "embroidery", "diwali", "entrance", "festive"],
    care: "Dry clean or hand-wash gently in cold water. Do not wring.",
    stock: 1,
    featured: true,
    badge: "Festive",
  },
  {
    id: "demo_13",
    name: "Kutch Embroidered Wall Panel",
    cat: "cat_textile",
    price: 1850,
    images: ["/stock/kutch-embroidery-detail-2.webp", "/stock/kutch-embroidery-detail.webp"],
    short: "Peacock-blue and saffron embroidery with mirror bindis — a jewel of colour for any wall.",
    description:
      "Hand-embroidered in the Kutchi style with interlocking petals, scrolls and mirror bindis.\n\nStretch it on a frame or hang it as a soft wall panel above a bed or sofa.",
    size: "18 × 24 inch (45 × 60 cm)",
    materials: ["Cotton", "Embroidery thread", "Glass mirrors"],
    colors: ["Blue", "Saffron", "Green"],
    tags: ["kutch", "embroidery", "wall panel", "mirror work", "living room"],
    care: "Dry clean only.",
    stock: 2,
  },
  {
    id: "demo_14",
    name: "Hand-Painted Diya Set of 4",
    cat: "cat_diyas",
    price: 649,
    images: ["/stock/painted-diyas.webp", "/stock/festive-diyas-glow.webp"],
    short: "Four clay diyas painted with mandala motifs — made to glow on your Diwali doorstep.",
    description:
      "Each clay diya is painted by hand with fine mandala patterns and sealed so it is ready to light.\n\nPerfect for Diwali, Dev Deepawali and as return gifts. Order in multiples of four for larger sets.",
    size: "Each about 3 inch (7.5 cm) across",
    materials: ["Terracotta clay", "Acrylic paint", "Sealant"],
    colors: ["Gold", "Blue", "Orange"],
    tags: ["diya", "diwali", "festive", "return gift", "pooja"],
    care: "Wipe clean after use. Use with oil or tea-lights.",
    stock: 20,
    best: true,
  },
  {
    id: "demo_15",
    name: "Terracotta Diya Stand",
    cat: "cat_diyas",
    price: 799,
    images: ["/stock/terracotta-diya-stand.webp"],
    short: "A sculptural clay deepak on a pedestal — earthy, simple and beautiful in a pooja corner.",
    description:
      "Thrown on the wheel and finished in a rich terracotta glaze, with a wide bowl that holds oil for long-burning light.\n\nLovely on a pooja shelf, a balcony or a festive table.",
    size: "About 8 inch (20 cm) tall",
    materials: ["Terracotta clay"],
    colors: ["Terracotta", "Red"],
    tags: ["diya", "deepak", "pooja", "terracotta", "festive"],
    care: "Wipe with a damp cloth. Not dishwasher safe.",
    stock: 6,
  },
  {
    id: "demo_16",
    name: "Brass-Edge Aarti Thali",
    cat: "cat_diyas",
    price: 1299,
    images: ["/stock/aarti-thali.webp"],
    short: "A hand-finished pooja thali with diya, shankh and space for chandan and flowers.",
    description:
      "A ready-to-use aarti thali with a scalloped rim, a small diya and a shankh, finished by hand for festivals and daily pooja.\n\nA thoughtful gift for weddings, griha pravesh and Diwali.",
    size: "12 inch (30 cm) diameter",
    materials: ["Metal", "Clay diya", "Shankh"],
    colors: ["Copper", "Silver"],
    tags: ["pooja", "aarti", "thali", "diwali", "wedding gift"],
    care: "Wipe dry after use to keep the shine.",
    stock: 3,
    custom: true,
  },
  {
    id: "demo_17",
    name: "Hand-Painted Terracotta Lamp Shade",
    cat: "cat_pottery",
    price: 1150,
    images: ["/stock/painted-lamp-shades.webp"],
    short: "A cheerful clay lantern painted with flowers and dots — cut-outs throw patterns of light.",
    description:
      "A wheel-thrown terracotta lantern hand-painted in bright folk colours, with cut-outs that scatter warm patterns when lit.\n\nHang it in a balcony, verandah or kid's room. Each one is painted individually, so colours vary.",
    size: "About 9 inch (23 cm) tall",
    materials: ["Terracotta clay", "Acrylic paint"],
    colors: ["Mustard", "Green", "Blue", "Red"],
    tags: ["lamp", "lantern", "terracotta", "balcony", "colourful", "pottery"],
    care: "Dust gently. Use only with LED bulbs.",
    stock: 5,
    badge: "New",
  },
];

export function seedDemoProductsV2(now: string): { sql: string; args: InValue[] }[] {
  return DEMOS_V2.map((d, i) => ({
    sql: `INSERT OR IGNORE INTO Product (id, slug, name, categoryId, price, compareAtPrice, images, shortDescription, description, size, materials, colors, tags, care, stock, madeToOrder, leadTimeDays, customizable, isActive, isFeatured, isBestseller, isDemo, badge, sortOrder, createdAt, updatedAt)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,1,?,?,?,?)`,
    args: [
      d.id,
      d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      d.name,
      d.cat,
      d.price,
      d.compare ?? null,
      JSON.stringify(d.images),
      d.short,
      d.description,
      d.size,
      JSON.stringify(d.materials),
      JSON.stringify(d.colors),
      JSON.stringify(d.tags),
      d.care,
      d.stock,
      d.mto ? 1 : 0,
      d.mto ?? null,
      d.custom ? 1 : 0,
      d.featured ? 1 : 0,
      d.best ? 1 : 0,
      d.badge ?? null,
      d.id === "demo_9" ? -1 : 20 + i, // the photographed sun mandala leads the homepage
      now,
      now,
    ],
  }));
}

export function seedCategoryStatements(cats: SeedCat[], now: string, offset = 0): { sql: string; args: InValue[] }[] {
  return cats.map((cat, i) => ({
    sql: `INSERT OR IGNORE INTO Category (id, name, slug, parentId, description, image, sortOrder, isActive, createdAt) VALUES (?,?,?,?,?,?,?,1,?)`,
    args: [cat.id, cat.name, cat.slug, cat.parentId, cat.description, cat.image, offset + i, now],
  }));
}
