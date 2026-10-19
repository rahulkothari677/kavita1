import { handler, bad } from "@/lib/api";
import { createSession, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export const POST = handler(async (req: Request) => {
  if (!rateLimit(req, "login", 10, 15 * 60 * 1000)) bad("Too many attempts. Please wait 15 minutes.", 429);
  const { password } = await req.json();
  if (!(await verifyPassword(String(password ?? "")))) bad("Incorrect password", 401);
  await createSession();
  return { ok: true };
});
