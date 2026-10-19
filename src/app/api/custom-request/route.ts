import { handler, bad } from "@/lib/api";
import { createCustomRequest } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";
import { rateLimit } from "@/lib/ratelimit";

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "") || null;

export const POST = handler(async (req: Request) => {
  if (!rateLimit(req, "custom", 6, 60 * 60 * 1000)) bad("Too many requests, please message us on WhatsApp.", 429);
  const b = await req.json();
  const name = clip(b.name, 80);
  const phone = clip(b.phone, 20);
  const description = clip(b.description, 2000);
  if (!name || !phone || !description) bad("Please share your name, WhatsApp number and idea.");
  const data = {
    name,
    phone,
    email: clip(b.email, 120),
    type: clip(b.type, 80),
    description,
    size: clip(b.size, 80),
    colors: clip(b.colors, 120),
    budget: clip(b.budget, 40),
    deadline: clip(b.deadline, 40),
    aiConcept: clip(b.aiConcept, 2000),
  };
  await createCustomRequest(data);
  const settings = await getSettings();
  const msg = [
    `🎨 *Custom order request*`,
    ``,
    `Hi! I'm ${name}. I'd love a custom ${data.type ?? "piece"}.`,
    ``,
    `📝 ${description}`,
    data.size ? `📏 Size: ${data.size}` : null,
    data.colors ? `🎨 Colours: ${data.colors}` : null,
    data.budget ? `💰 Budget: ${data.budget}` : null,
    data.deadline ? `📅 Needed by: ${data.deadline}` : null,
    ``,
    `I can share reference photos here 📷`,
  ]
    .filter((l) => l !== null)
    .join("\n");
  return { ok: true, waUrl: waLink(settings.whatsappNumber, msg) };
});
