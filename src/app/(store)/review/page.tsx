import type { Metadata } from "next";
import { ReviewForm } from "@/components/store/ReviewForm";
import { PageIntro } from "@/components/store/pages/ui";

export const metadata: Metadata = { title: "Leave a review", robots: { index: false } };

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <div className="container-x section-y">
      <div className="mx-auto max-w-[560px]">
        <PageIntro
          eyebrow={order ? `Order ${order}` : "Reviews"}
          title={
            <>
              How did we <em>do</em>?
            </>
          }
          lede="A few honest words help a small studio grow, and help others choose with confidence. Thank you."
        />
        <div className="hairline-t mt-10 pt-8">
          <ReviewForm orderNumber={order} />
        </div>
      </div>
    </div>
  );
}
