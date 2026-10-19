import { handler, bad } from "@/lib/api";
import { aiJSON, aiProvider, BRAND_VOICE } from "@/lib/ai";
import { catalogContext, keywordMatch } from "@/lib/catalog-ai";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export const POST = handler(async (req: Request) => {
  if (!rateLimit(req, "gift", 15, 60 * 60 * 1000)) bad("Too many requests, please try again later.", 429);
  const b = await req.json();
  const occasion = String(b.occasion ?? "").slice(0, 80);
  const recipient = String(b.recipient ?? "").slice(0, 80);
  const budget = Number(b.budget) || 0;
  const style = String(b.style ?? "").slice(0, 200);
  const catalog = await catalogContext();
  const inBudget = catalog.products.filter((p) => !budget || p.price <= budget * 1.1);

  if (!aiProvider()) {
    const picks = keywordMatch(inBudget, `${occasion} ${recipient} ${style} gift`, 3);
    return {
      intro: "Here are our handpicked suggestions for you 💛",
      picks: picks.map((p) => ({ product: p, reason: p.shortDescription })),
    };
  }

  const out = await aiJSON<{ intro: string; picks: { id: string; reason: string }[]; personalTouch?: string }>(
    `${BRAND_VOICE}\nYou are a thoughtful gift advisor. Choose the best 3 products for the brief from this catalogue (id | name | category | price | availability | tags | description):\n${catalog.text}`,
    `Occasion: ${occasion}\nFor: ${recipient}\nBudget: ${budget ? `up to ₹${budget}` : "flexible"}\nStyle/notes: ${style || "-"}\n\nReturn JSON {"intro": one warm sentence, "picks": [{"id": catalogue id, "reason": one sentence why it's perfect for this person}], "personalTouch": a short idea for personalising the gift or the card message}. Prefer items within budget and in stock.`,
  );
  const picks = (out.picks ?? [])
    .map((x) => ({ product: catalog.products.find((p) => p.id === x.id), reason: x.reason }))
    .filter((x) => x.product)
    .slice(0, 3);
  return { intro: out.intro, picks, personalTouch: out.personalTouch };
});
