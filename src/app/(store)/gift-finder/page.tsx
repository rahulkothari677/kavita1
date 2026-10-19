import type { Metadata } from "next";
import { GiftFinderClient } from "./GiftFinderClient";

export const metadata: Metadata = { title: "Gift finder", description: "Find a handmade gift in under a minute: tell us who it’s for and we’ll suggest pieces from the studio." };

export default async function GiftFinderPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  return <GiftFinderClient initialQ={(Array.isArray(q) ? q[0] : q) ?? ""} />;
}
