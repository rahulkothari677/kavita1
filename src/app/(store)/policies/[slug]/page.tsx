import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";

const MAP = {
  shipping: { title: "Shipping", key: "shippingPolicy" },
  returns: { title: "Returns & damage", key: "returnPolicy" },
  care: { title: "Care guide", key: "careGuide" },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: MAP[slug as keyof typeof MAP]?.title ?? "Policy" };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = MAP[slug as keyof typeof MAP];
  if (!m) notFound();
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 md:py-20">
      <h1 className="font-display text-5xl">{m.title}</h1>
      <div className="prose-ka mt-8 text-[17px] text-ink/80">
        {String(s[m.key]).split("\n").filter(Boolean).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
