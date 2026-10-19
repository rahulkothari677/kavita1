import { handler, bad } from "@/lib/api";
import { createSession, hasAdminPassword, setAdminPassword } from "@/lib/auth";

/** First-run: lets the owner create the admin password (only works while none exists). */
export const POST = handler(async (req: Request) => {
  if (await hasAdminPassword()) bad("Admin password already set", 403);
  const { password } = await req.json();
  if (String(password ?? "").length < 8) bad("Password must be at least 8 characters");
  await setAdminPassword(String(password));
  await createSession();
  return { ok: true };
});
