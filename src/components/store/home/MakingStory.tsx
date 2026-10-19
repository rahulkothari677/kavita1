"use client";

import { useEffect, useRef, useState } from "react";
import { SnapRail } from "./SnapRail";

export type MakingStep = { title: string; body: string; note: string; image: string; alt: string };

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * "The Making" — desktop sticky scrollytelling (image crossfades as each step crosses
 * the middle of the viewport), a snap carousel on mobile, and a static stacked list
 * whenever the visitor prefers reduced motion.
 */
export function MakingStory({ steps }: { steps: MakingStep[] }) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Desktop, motion allowed: sticky image + tall steps */}
      <div className="mt-14 hidden lg:motion-safe:grid lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-6">
          <div className="sticky top-[12vh] h-[76vh]">
            <div className="relative aspect-[4/5] h-full max-w-full overflow-hidden rounded-[2px] bg-ink-deep-raised">
              {steps.map((s, i) => (
                <img
                  key={i}
                  src={s.image}
                  alt={i === active ? s.alt : ""}
                  aria-hidden={i === active ? undefined : true}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ease-in-out ${i === active ? "opacity-100" : "opacity-0"}`}
                />
              ))}
            </div>
          </div>
        </div>
        <ol className="lg:col-span-5 lg:col-start-8">
          {steps.map((s, i) => (
            <li
              key={s.title}
              ref={(el) => {
                items.current[i] = el;
              }}
              data-step={i}
              aria-current={i === active ? "step" : undefined}
              className="flex min-h-[70vh] flex-col justify-center"
            >
              <span
                aria-hidden
                className={`font-display tabular text-[64px] leading-none transition-colors duration-300 ease-out ${i === active ? "text-accent-on-dark" : "text-muted-on-dark"}`}
              >
                {num(i)}
              </span>
              <h3 className="t-h3 mt-6 text-on-dark">{s.title}</h3>
              <p className="mt-3 max-w-[40ch] text-[16px] text-muted-on-dark">{s.body}</p>
              <p className="mt-6 text-[12px] font-semibold tracking-[0.14em] text-on-dark uppercase">{s.note}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Mobile, motion allowed: snap carousel */}
      <SnapRail label="The making, step by step" tone="dark" focusable className="mt-10 lg:hidden motion-reduce:hidden">
        {steps.map((s, i) => (
          <figure key={s.title} className="w-[84vw] shrink-0 snap-start sm:w-[58vw]">
            <div className="aspect-[4/5] overflow-hidden rounded-[2px] bg-ink-deep-raised">
              <img src={s.image} alt={s.alt} loading="lazy" decoding="async" className="size-full object-cover" />
            </div>
            <figcaption className="mt-5">
              <span aria-hidden className="font-display tabular block text-[40px] leading-none text-muted-on-dark">
                {num(i)}
              </span>
              <span className="t-h3 mt-3 block text-on-dark">{s.title}</span>
              <span className="mt-2 block text-[15px] text-muted-on-dark">{s.body}</span>
            </figcaption>
          </figure>
        ))}
      </SnapRail>

      {/* Reduced motion: static stacked list */}
      <ol className="mt-10 hidden gap-x-6 gap-y-12 motion-reduce:grid sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title}>
            <div className="aspect-[4/5] overflow-hidden rounded-[2px] bg-ink-deep-raised">
              <img src={s.image} alt={s.alt} loading="lazy" decoding="async" className="size-full object-cover" />
            </div>
            <span aria-hidden className="font-display tabular mt-5 block text-[40px] leading-none text-muted-on-dark">
              {num(i)}
            </span>
            <h3 className="t-h3 mt-3 text-on-dark">{s.title}</h3>
            <p className="mt-2 text-[15px] text-muted-on-dark">{s.body}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
