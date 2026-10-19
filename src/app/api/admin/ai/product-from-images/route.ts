import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { aiJSON, BRAND_VOICE, type AiImage } from "@/lib/ai";
import { categoryTree, listProducts } from "@/lib/repo";

export const maxDuration = 60;

export type ProductDraft = {
  name: string;
  categoryId: string | null;
  newCategorySuggestion?: string | null;
  shortDescription: string;
  description: string;
  size: string;
  materials: string[];
  colors: string[];
  tags: string[];
  care: string;
  suggestedPrice: number;
  priceRange: string;
  customizable: boolean;
  seoTitle: string;
  seoDescription: string;
  instagramCaption: string;
};

/** "Snap & Sell": photos of a handmade piece → a complete, ready-to-review product listing. */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const { images, hint } = (await req.json()) as { images: AiImage[]; hint?: string };
  if (!images?.length) bad("Add at least one photo");
  const [tree, products] = await Promise.all([categoryTree(), listProducts({ limit: 40, sort: "newest" })]);
  const cats = tree.flatMap((c) => [`${c.id} = ${c.name}`, ...(c.children ?? []).map((s) => `${s.id} = ${c.name} › ${s.name}`)]).join("\n");
  const priceRef = products.slice(0, 25).map((p) => `${p.name}: ₹${p.price}${p.size ? ` (${p.size})` : ""}`).join("\n");

  const draft = await aiJSON<ProductDraft>(
    `${BRAND_VOICE}
You are an expert e-commerce copywriter and pricing assistant for handmade products. Look carefully at the photos of ONE handmade product and create a complete, beautiful product listing. Be accurate about what you can see (shape, colours, technique, materials); do not invent things that aren't visible. Indian market pricing for premium handmade decor.`,
    `Available categories (id = name). Choose the MOST specific matching id (prefer a sub-category). If nothing fits, set categoryId to null and suggest a new category name:
${cats}

Recent products & prices from this store for price reference:
${priceRef || "(none yet)"}

${hint ? `Note from the artist: ${hint}\n` : ""}
Return JSON with keys:
{"name": evocative 2-5 word product name (no brand name),
 "categoryId": id or null,
 "newCategorySuggestion": string or null,
 "shortDescription": 1-2 sentence emotional hook (max 180 chars),
 "description": 2-3 short paragraphs separated by \\n\\n: what it is, how it's handmade, where it looks best / gifting idea,
 "size": estimated size like "12 inch (30 cm) diameter" (say "approx."),
 "materials": array, "colors": array of 2-4 colour names, "tags": 5-8 lowercase search tags (rooms, occasions, style),
 "care": one-line care instruction,
 "suggestedPrice": integer INR ending in 9 (e.g. 1499),
 "priceRange": e.g. "₹1,299 – ₹1,699",
 "customizable": boolean (true if colours/names could easily be personalised),
 "seoTitle": max 60 chars, "seoDescription": max 155 chars,
 "instagramCaption": engaging caption with 2-3 emojis + 8 relevant hashtags}`,
    images.slice(0, 4),
  );
  return { draft };
});
