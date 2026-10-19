import { handler, bad } from "@/lib/api";
import { addSubscriber } from "@/lib/repo";
import { rateLimit } from "@/lib/ratelimit";

export const POST = handler(async (req: Request) => {
  if (!rateLimit(req, "sub", 5, 60 * 60 * 1000)) bad("Too many requests", 429);
  const { contact } = await req.json();
  const c = String(contact ?? "").trim().slice(0, 120);
  if (c.length < 5) bad("Please enter an email or phone number");
  await addSubscriber(c);
  return { ok: true };
});
