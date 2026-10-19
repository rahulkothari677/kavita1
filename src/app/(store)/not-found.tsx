import Link from "next/link";
import { Lotus } from "@/components/Motifs";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-28 text-center">
      <Lotus className="mx-auto h-14 text-accent" />
      <h1 className="mt-6 font-display text-5xl">This page wandered off</h1>
      <p className="mt-3 text-muted">It may have sold out or moved. Let&apos;s get you back to something lovely.</p>
      <Link href="/shop" className="btn btn-primary mt-8">Explore the collection</Link>
    </div>
  );
}
