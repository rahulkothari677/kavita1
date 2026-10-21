import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional separate admin web address (e.g. kavita1-admin.vercel.app, added under Vercel → Domains).
 * A different address makes the admin a fully separate app on phones, so Chrome never confuses it
 * with the installed shop app. On any host containing "admin", the home page opens the admin.
 * "/?shop" still shows the shop (used by the admin's "View website" links).
 * Runs only for "/" so it adds no cost to any other request.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (host.includes("admin") && !request.nextUrl.searchParams.has("shop")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: "/" };
