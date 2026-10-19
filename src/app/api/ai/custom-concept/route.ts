import { handler, bad } from "@/lib/api";
import { aiJSON, aiProvider, BRAND_VOICE } from "@/lib/ai";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export const POST = handler(async (req: Request) => {
  if (!aiProvider()) bad("AI design ideas are not available right now — just describe your idea and we'll take it from there!", 503);
  if (!rateLimit(req, "concept", 10, 60 * 60 * 1000)) bad("Too many requests, please try again later.", 429);
  const b = await req.json();
  const out = await aiJSON<{ title: string; concept: string; palette: string[]; size: string; elements: string[] }>(
    `${BRAND_VOICE}\nYou help customers shape their idea for a custom handmade piece into a clear design brief the artist can quote on. Be realistic about what a home studio can make by hand.`,
    `Type: ${String(b.type ?? "").slice(0, 80)}\nIdea: ${String(b.description ?? "").slice(0, 1200)}\nColours: ${String(b.colors ?? "").slice(0, 120)}\nSize: ${String(b.size ?? "").slice(0, 80)}\n\nReturn JSON {"title": short name for the piece, "concept": 2-3 sentence description of the design, "palette": 3-5 colour names, "size": recommended size, "elements": 3-5 key design elements}`,
  );
  return out;
});
