import Link from "next/link";
import { EmptyArt } from "@/components/brand";
import { ArrowLink } from "@/components/store/pages/ui";

export default function NotFound() {
  return (
    <div className="container-x section-y">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <EmptyArt kind="mandala" size={120} />
        <p className="eyebrow mt-8">Error 404</p>
        <h1 className="font-display mt-4 text-[clamp(1.75rem,1.4rem+1.6vw,2.5rem)] leading-tight font-[360] tracking-[-0.015em]">
          This page has <em>wandered</em> off
        </h1>
        <p className="mt-3 max-w-[40ch] text-[15px] text-muted">It may have sold, or moved to a new wall. Let’s find you something lovely instead.</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <Link href="/shop" className="btn btn-primary max-[400px]:w-full">
            Explore the collection
          </Link>
          <ArrowLink href="/">Back to home</ArrowLink>
        </div>
      </div>
    </div>
  );
}
