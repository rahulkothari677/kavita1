import { handler, bad } from "@/lib/api";
import { aiJSON, aiProvider, BRAND_VOICE, type ChatMsg } from "@/lib/ai";
import { catalogContext, keywordMatch, storeFacts, toMini } from "@/lib/catalog-ai";
import { getSettings } from "@/lib/settings";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export const POST = handler(async (req: Request) => {
  if (!rateLimit(req, "assistant", 30, 60 * 60 * 1000)) bad("You're chatting fast! Please try again in a little while or message us on WhatsApp.", 429);
  const { messages } = (await req.json()) as { messages: ChatMsg[] };
  const history = (messages ?? []).slice(-10).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 1000) })) as ChatMsg[];
  const last = history[history.length - 1]?.content ?? "";
  const [settings, catalog] = await Promise.all([getSettings(), catalogContext()]);

  if (!aiProvider()) {
    const picks = keywordMatch(catalog.products, last);
    return {
      reply: picks.length ? "Here are a few handmade pieces you might love 💛 For anything specific, tap the WhatsApp button and chat with Kavita directly!" : "I'd love to help! Message us on WhatsApp and Kavita will reply personally 💛",
      products: picks.map(toMini),
    };
  }

  const system = `${BRAND_VOICE}
You are "${settings.aiAssistantName}", the friendly shopping assistant on the ${settings.storeName} website. Help visitors find the right handmade piece, choose gifts, understand ordering/shipping/custom orders. Keep replies short (2–4 sentences), warm, with at most one emoji. Only recommend products from the catalogue below, using their exact ids. Never invent products, prices or policies. If asked something you don't know (e.g. exact delivery date), suggest messaging Kavita on WhatsApp. Reply in the same language the customer uses (English, Hindi or Hinglish).

${storeFacts(settings)}

Catalogue (id | name | category | price | availability | tags | description):
${catalog.text}`;

  const convo = history.map((m) => `${m.role === "user" ? "Customer" : settings.aiAssistantName}: ${m.content}`).join("\n");
  const out = await aiJSON<{ reply: string; productIds?: string[] }>(
    system,
    `Conversation so far:\n${convo}\n\nReturn JSON: {"reply": string, "productIds": string[] (0–4 ids from the catalogue that fit, empty if not relevant)}`,
  );
  const products = (out.productIds ?? []).map((id) => catalog.products.find((p) => p.id === id)).filter(Boolean).slice(0, 4).map((p) => toMini(p!));
  return { reply: out.reply, products };
});
