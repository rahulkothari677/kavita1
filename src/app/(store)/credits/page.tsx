import type { Metadata } from "next";
import { PHOTO_CREDITS } from "@/lib/credits";

export const metadata: Metadata = { title: "Photo credits" };

export default function CreditsPage() {
  return (
    <div className="container-x section-y">
      <p className="eyebrow">Thank you</p>
      <h1 className="t-h1 mt-3">
        Photo <em>credits</em>
      </h1>
      <p className="t-body-lg mt-4 max-w-[62ch] text-ink-2">
        Some photographs on this website are shared by photographers and craftspeople under open licences. We are grateful to them — here they are, with
        their licences.
      </p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PHOTO_CREDITS.map((c) => (
          <li key={c.image} className="flex gap-4">
            <img src={c.image} alt="" loading="lazy" decoding="async" className="aspect-[4/5] w-20 shrink-0 rounded-img bg-plinth object-cover" />
            <div className="min-w-0 text-[14px] leading-relaxed">
              <p className="font-medium text-ink">{c.title}</p>
              <p className="text-muted">by {c.creator}</p>
              <p className="text-muted">
                {c.licenseUrl ? (
                  <a href={c.licenseUrl} target="_blank" rel="noreferrer" className="link">
                    {c.license}
                  </a>
                ) : (
                  c.license
                )}{" "}
                ·{" "}
                <a href={c.source} target="_blank" rel="noreferrer" className="link">
                  Source
                </a>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-[13px] text-muted">Photos were cropped and resized for this website.</p>
    </div>
  );
}
