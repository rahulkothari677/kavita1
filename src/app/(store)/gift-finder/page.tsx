import type { Metadata } from "next";
import { GiftFinderClient } from "./GiftFinderClient";

export const metadata: Metadata = { title: "AI Gift Finder", description: "Find the perfect handmade gift in 30 seconds." };

export default function GiftFinderPage() {
  return <GiftFinderClient />;
}
