import type { Metadata } from "next";
import { ReviewForm } from "@/components/store/ReviewForm";

export const metadata: Metadata = { title: "Leave a review", robots: { index: false } };

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-center font-display text-5xl">How did we do?</h1>
      <p className="mt-3 text-center text-muted">Your words help a small studio grow. Thank you 💛</p>
      <div className="mt-8">
        <ReviewForm orderNumber={order} />
      </div>
    </div>
  );
}
