import { handler } from "@/lib/api";
import { evaluateCoupon } from "@/lib/repo";

export const POST = handler(async (req: Request) => {
  const { code, subtotal } = await req.json();
  if (!code) return { error: "Enter a code" };
  return evaluateCoupon(String(code), Number(subtotal) || 0);
});
