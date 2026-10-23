import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { ensureDb, query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Diagnostics for the live check: where the server runs, which region the database is in (only the
 * region part of its host name), how long round trips take, and which database this deployment uses:
 * `dbId` is a short one-way fingerprint of its address (it never reveals it) and `dbFirstData` is when
 * its oldest product row was written. Both must stay the same across deployments; if they change,
 * each deployment is getting a new database (e.g. a per-deployment branch) and saved data is lost.
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
  const dbId = url ? createHash("sha256").update(url).digest("hex").slice(0, 10) : "temporary";
  const dbVar = process.env.DATABASE_URL ? "DATABASE_URL" : process.env.TURSO_DATABASE_URL ? "TURSO_DATABASE_URL" : "none";
  const first = await query<{ t: string | null }>("SELECT MIN(createdAt) AS t FROM Product");
  return NextResponse.json(
    {
      serverRegion: process.env.VERCEL_REGION ?? "local",
      env: process.env.VERCEL_ENV ?? "local",
      dbRegion,
      dbVar,
      dbId,
      dbFirstData: first[0]?.t ?? null,
      initMs: Math.round(init),
      roundTripMs: trips,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
