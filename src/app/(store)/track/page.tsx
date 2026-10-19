import type { Metadata } from "next";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-16 md:py-24">
      <p className="text-center text-[12px] tracking-[0.3em] text-accent uppercase">Where&apos;s my piece?</p>
      <h1 className="mt-2 text-center font-display text-5xl">Track your order</h1>
      <p className="mt-3 text-center text-muted">Enter your order number and the WhatsApp number you used.</p>
      <TrackForm initialOrder={sp.order ?? ""} />
    </div>
  );
}
