import { handler, bad } from "@/lib/api";
import { requireAdmin, setAdminPassword, verifyPassword } from "@/lib/auth";

export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const { current, next } = await req.json();
  if (!(await verifyPassword(String(current ?? "")))) bad("Current password is incorrect");
  if (String(next ?? "").length < 8) bad("New password must be at least 8 characters");
  await setAdminPassword(String(next));
  return { ok: true };
});
