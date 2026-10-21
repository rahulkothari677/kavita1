import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import StoreNotFound from "./(store)/not-found";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/**
 * Addresses that match no route at all (e.g. a mistyped link) land here, outside the shop
 * layout. Show the shop's own 404 under a simple logo bar instead of the framework's plain page.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="container-x flex h-16 items-center justify-center">
          <Link href="/" aria-label="Kavita’s Artistry, home">
            <Wordmark size="sm" />
          </Link>
        </div>
      </header>
      <main id="main" className="flex-1">
        <StoreNotFound />
      </main>
    </div>
  );
}
