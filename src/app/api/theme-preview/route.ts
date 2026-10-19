import { NextResponse } from "next/server";
import { getTheme } from "@/lib/themes";

/** Lets the owner preview a theme on the live site (only in their own browser) before applying it. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("theme");
  const res = NextResponse.redirect(new URL(url.searchParams.get("to") || "/", url));
  if (!id || id === "off") res.cookies.delete("ka_theme_preview");
  else res.cookies.set("ka_theme_preview", getTheme(id).id, { path: "/", maxAge: 60 * 60, sameSite: "lax" });
  return res;
}
