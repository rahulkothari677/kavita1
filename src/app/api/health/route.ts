import { NextResponse } from "next/server";
import { ensureDb, query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Speed diagnostics for the live check: where the server runs, which region the database is in
 * (only the region part of its host name) and how long database round trips take.
 */
export async function GET() {
  const t0 = performance.now();
  await ensureDb();
  const init = performance.now() - t0;
  const trips: number[] = [];
  for (let i = 0; i < 3; i++) {
    const t = performance.now();
    await query("SELECT 1");
    trips.push(Math.round(performance.now() - t));
  }
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "";
  const dbRegion = url.match(/\.((?:aws|gcp|fly)-[a-z0-9-]+)\.turso\.io/)?.[1] ?? (url ? "unknown" : "none");
  return NextResponse.json(
    { serverRegion: process.env.VERCEL_REGION ?? "local", dbRegion, initMs: Math.round(init), roundTripMs: trips },
    { headers: { "Cache-Control": "no-store" } },
  );
}
