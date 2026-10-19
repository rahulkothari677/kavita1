import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

/**
 * AI provider abstraction. Set ONE of:
 *  - ANTHROPIC_API_KEY  → Claude (model: ANTHROPIC_MODEL, default claude-opus-5-5)
 *  - GEMINI_API_KEY     → Google Gemini (model: GEMINI_MODEL, default gemini-2.5-flash; has a free tier)
 * If neither is set, AI features gracefully fall back to simple rule-based behaviour.
 */

export type AiImage = { data: string; mime: string }; // base64 (no data: prefix)
export type ChatMsg = { role: "user" | "assistant"; content: string };

export function aiProvider(): "claude" | "gemini" | null {
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return "gemini";
  return null;
}

export class AiUnavailableError extends Error {
  constructor() {
    super("AI is not configured. Add GEMINI_API_KEY or ANTHROPIC_API_KEY in your Vercel environment variables.");
  }
}

let anthropic: Anthropic | null = null;
let gemini: GoogleGenAI | null = null;

async function claudeCall(system: string, messages: ChatMsg[], images: AiImage[] = []): Promise<string> {
  anthropic ??= new Anthropic();
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  const last = messages[messages.length - 1];
  for (const img of images) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.mime as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: img.data },
    });
  }
  content.push({ type: "text", text: last.content });
  const params = {
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 4000,
    system,
    output_config: { effort: "low" },
    messages: [...messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })), { role: "user" as const, content }],
    // Server-side fallback: if a request is declined by a safety classifier, the API retries on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };
  const res = await anthropic.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (res.stop_reason === "refusal") throw new Error("The AI couldn't help with that request.");
  return res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("")
    .trim();
}

async function geminiCall(system: string, messages: ChatMsg[], images: AiImage[] = [], jsonMode = false): Promise<string> {
  gemini ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY });
  const contents = messages.map((m, i) => {
    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
    if (i === messages.length - 1) for (const img of images) parts.push({ inlineData: { mimeType: img.mime, data: img.data } });
    parts.push({ text: m.content });
    return { role: m.role === "assistant" ? "model" : "user", parts };
  });
  const res = await gemini.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents,
    config: { systemInstruction: system, ...(jsonMode ? { responseMimeType: "application/json" } : {}) },
  });
  return (res.text ?? "").trim();
}

export async function aiChat(system: string, messages: ChatMsg[], images: AiImage[] = []): Promise<string> {
  const p = aiProvider();
  if (!p) throw new AiUnavailableError();
  return p === "claude" ? claudeCall(system, messages, images) : geminiCall(system, messages, images);
}

export async function aiJSON<T>(system: string, prompt: string, images: AiImage[] = []): Promise<T> {
  const p = aiProvider();
  if (!p) throw new AiUnavailableError();
  const sys = `${system}\n\nRespond with a single valid JSON object only — no markdown, no code fences, no commentary.`;
  const msgs: ChatMsg[] = [{ role: "user", content: prompt }];
  const text = p === "claude" ? await claudeCall(sys, msgs, images) : await geminiCall(sys, msgs, images, true);
  return parseJsonLoose<T>(text);
}

export function parseJsonLoose<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error("AI returned an unexpected response. Please try again.");
  }
}

export const BRAND_VOICE = `You write for "Kavita's Artistry", a small Indian home studio selling all kinds of handmade art and craft — Lippan art (Kutch mud-and-mirror work), wall decor, paintings, resin art, macramé, candles, crochet, festive decor, gifts, name plates, home accents and custom creations. Brand tagline: "Handmade with love" and "Art that adds happiness to your space". Voice: warm, personal, elegant, simple English that Indian customers love; never pushy or over-hyped. Prices are in Indian Rupees (₹).`;
