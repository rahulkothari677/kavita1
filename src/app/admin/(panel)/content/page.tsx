"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, ImagePlus, LayoutTemplate, Loader2, Megaphone, MessageCircleQuestion, Plus, ScrollText, Trash2 } from "lucide-react";
import { adminBtn, Loading, PageHeader, Switch, useToast } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettings";
import { SaveBar } from "@/components/admin/SaveBar";
import { Field, LoadError, Section } from "@/components/admin/core/form";
import { uploadImages } from "@/lib/client-image";
import { imgUrl } from "@/lib/format";
import type { HeroSlide } from "@/lib/types";

const SW = 1.75;
const iconBtn = "grid size-11 place-items-center rounded-[6px] text-muted transition-colors hover:bg-admin-sidebar hover:text-ink disabled:opacity-40 md:size-9";

export default function ContentPage() {
  const { s, set, save, saving, dirty, discard, error, reload } = useSettingsForm();
  const toast = useToast();
  const [uploading, setUploading] = useState<string | null>(null);
  if (!s) return error ? <LoadError message={error} onRetry={reload} /> : <Loading />;

  const upload = async (files: FileList | null, done: (url: string) => void, key: string) => {
    if (!files?.[0]) return;
    setUploading(key);
    try {
      const [url] = await uploadImages([files[0]]);
      done(url);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "err");
    } finally {
      setUploading(null);
    }
  };

  const slides = s.heroSlides;
  const setSlide = (i: number, patch: Partial<HeroSlide>) => set("heroSlides", slides.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  const moveSlide = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    set("heroSlides", next);
  };
  const addSlide = () => set("heroSlides", [...slides, { id: `h${Date.now()}`, title: "New headline", subtitle: "", eyebrow: "", ctaLabel: "Explore the collection", ctaLink: "/shop", image: "" }]);
  const setFaq = (i: number, patch: Partial<{ q: string; a: string }>) => set("faqs", s.faqs.map((x, n) => (n === i ? { ...x, ...patch } : x)));

  return (
    <div className="pb-24 md:pb-8">
      <PageHeader
        title="Website content"
        subtitle="Change what customers see. No coding needed."
        actions={
          <a href="/" target="_blank" rel="noreferrer" className={adminBtn.secondary}>
            Preview website <span aria-hidden>↗</span>
          </a>
        }
      />

      <div className="space-y-6">
        <Section title="Announcement bar" text="The thin dark strip above the header. Separate up to three messages with a middle dot ( · )." icon={<Megaphone />}>
          <div className="flex items-start gap-4">
            <Field label="Message" className="min-w-0 flex-1" helper={s.codAvailable ? undefined : "Cash-on-delivery mentions are hidden while COD is off in Settings."}>
              <input value={s.announcement} onChange={(e) => set("announcement", e.target.value)} className="input" placeholder="Free shipping over ₹1,999 · Custom orders open" />
            </Field>
            <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
              <span className="text-[13px] font-semibold">{s.announcementActive ? "On" : "Off"}</span>
              <Switch checked={s.announcementActive} onChange={(v) => set("announcementActive", v)} label="Show announcement bar" />
            </div>
          </div>
        </Section>

        <Section title="Homepage hero" text="The first slide is what customers see at the top of your homepage. Keep spare versions below and move one up to swap." icon={<LayoutTemplate />}>
          <ol className="space-y-4">
            {slides.map((sl, i) => (
              <li key={sl.id} className={`rounded-[8px] border p-4 ${i === 0 ? "border-ink" : "border-admin-line bg-admin-inset"}`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold">
                    {i === 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className="size-1.5 rounded-full bg-success" /> Live on homepage
                      </span>
                    ) : (
                      <span className="text-muted">Spare version {i}</span>
                    )}
                  </p>
                  <div className="flex items-center">
                    <button type="button" onClick={() => moveSlide(i, -1)} disabled={i === 0} className={iconBtn} aria-label={i === 1 ? "Make this the live hero" : "Move up"}>
                      <ArrowUp className="size-4" strokeWidth={SW} />
                    </button>
                    <button type="button" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1} className={iconBtn} aria-label="Move down">
                      <ArrowDown className="size-4" strokeWidth={SW} />
                    </button>
                    {slides.length > 1 && (
                      <button type="button" onClick={() => set("heroSlides", slides.filter((_, n) => n !== i))} className={`${iconBtn} hover:text-danger`} aria-label="Delete this version">
                        <Trash2 className="size-4" strokeWidth={SW} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                  <div>
                    <label className="relative grid aspect-[4/5] w-full max-w-[160px] cursor-pointer place-items-center overflow-hidden rounded-t-full rounded-b-[2px] border border-dashed border-line-strong bg-plinth focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
                      {uploading === sl.id ? (
                        <Loader2 className="size-5 animate-spin text-muted" aria-label="Uploading" />
                      ) : sl.image ? (
                        <img src={imgUrl(sl.image, 400)} alt="Hero photo" className="size-full object-cover" />
                      ) : (
                        <span className="flex flex-col items-center gap-1 px-3 text-center text-[12px] leading-4 text-muted">
                          <ImagePlus className="size-5" strokeWidth={SW} aria-hidden /> Add photo
                          <span>(uses a featured piece if empty)</span>
                        </span>
                      )}
                      <input type="file" accept="image/*" className="sr-only" aria-label="Upload hero photo" onChange={(e) => upload(e.target.files, (url) => setSlide(i, { image: url }), sl.id)} />
                    </label>
                    {sl.image && (
                      <button type="button" onClick={() => setSlide(i, { image: "" })} className="mt-1 min-h-11 text-[13px] text-muted underline underline-offset-2 hover:text-ink md:min-h-8">
                        Remove photo
                      </button>
                    )}
                  </div>
                  <div className="grid content-start gap-3 md:grid-cols-2">
                    <Field label="Headline" helper="Short and warm. Around 6 to 9 words reads best." className="md:col-span-2">
                      <input value={sl.title} onChange={(e) => setSlide(i, { title: e.target.value })} placeholder="Art made slowly, by hand." className="input" />
                    </Field>
                    <Field label="Supporting line" className="md:col-span-2">
                      <textarea value={sl.subtitle ?? ""} onChange={(e) => setSlide(i, { subtitle: e.target.value })} rows={2} className="input" />
                    </Field>
                    <Field label="Button text">
                      <input value={sl.ctaLabel ?? ""} onChange={(e) => setSlide(i, { ctaLabel: e.target.value })} placeholder="Explore the collection" className="input" />
                    </Field>
                    <Field label="Button link">
                      <input value={sl.ctaLink ?? ""} onChange={(e) => setSlide(i, { ctaLink: e.target.value })} placeholder="/shop" className="input" spellCheck={false} autoCapitalize="none" />
                    </Field>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <button type="button" onClick={addSlide} className={`${adminBtn.secondary} mt-4`}>
            <Plus className="size-4" strokeWidth={SW} aria-hidden /> Add a spare version
          </button>
        </Section>

        <Section title="Your story" text="Shown on the About page and in ‘Meet the maker’ on the homepage." icon={<BookOpen />}>
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div>
              <label className="relative grid aspect-[4/5] w-full max-w-[160px] cursor-pointer place-items-center overflow-hidden rounded-t-full rounded-b-[2px] border border-dashed border-line-strong bg-plinth focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
                {uploading === "artist" ? (
                  <Loader2 className="size-5 animate-spin text-muted" aria-label="Uploading" />
                ) : s.artistImage ? (
                  <img src={imgUrl(s.artistImage, 400)} alt="Your portrait" className="size-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1 px-3 text-center text-[12px] leading-4 text-muted">
                    <ImagePlus className="size-5" strokeWidth={SW} aria-hidden /> Your photo
                  </span>
                )}
                <input type="file" accept="image/*" className="sr-only" aria-label="Upload your portrait" onChange={(e) => upload(e.target.files, (url) => set("artistImage", url), "artist")} />
              </label>
              {s.artistImage && (
                <button type="button" onClick={() => set("artistImage", "")} className="mt-1 min-h-11 text-[13px] text-muted underline underline-offset-2 hover:text-ink md:min-h-8">
                  Remove photo
                </button>
              )}
            </div>
            <div className="grid content-start gap-3 md:grid-cols-2">
              <Field label="Title">
                <input value={s.aboutTitle} onChange={(e) => set("aboutTitle", e.target.value)} className="input" />
              </Field>
              <Field label="Your name" helper="Used as your sign-off.">
                <input value={s.artistName} onChange={(e) => set("artistName", e.target.value)} className="input" />
              </Field>
              <Field label="Story" helper="Leave a blank line between paragraphs." className="md:col-span-2">
                <textarea value={s.aboutStory} onChange={(e) => set("aboutStory", e.target.value)} rows={9} className="input" />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="FAQs" text="Answers to what customers ask most on WhatsApp." icon={<MessageCircleQuestion />}>
          {s.faqs.length === 0 && <p className="mb-3 text-[14px] text-muted">No questions yet.</p>}
          <ol className="space-y-3">
            {s.faqs.map((f, i) => (
              <li key={i} className="flex gap-2 rounded-[8px] border border-admin-line p-3 md:p-4">
                <span className="tabular w-6 shrink-0 pt-3 text-[13px] font-semibold text-muted">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1 space-y-2">
                  <input value={f.q} onChange={(e) => setFaq(i, { q: e.target.value })} placeholder="Question" aria-label={`Question ${i + 1}`} className="input font-semibold" />
                  <textarea value={f.a} onChange={(e) => setFaq(i, { a: e.target.value })} placeholder="Answer" aria-label={`Answer ${i + 1}`} rows={2} className="input" />
                </div>
                <button type="button" onClick={() => set("faqs", s.faqs.filter((_, n) => n !== i))} className={`${iconBtn} shrink-0 hover:text-danger`} aria-label={`Delete question ${i + 1}`}>
                  <Trash2 className="size-4" strokeWidth={SW} />
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => set("faqs", [...s.faqs, { q: "", a: "" }])} className={`${adminBtn.secondary} mt-4`}>
            <Plus className="size-4" strokeWidth={SW} aria-hidden /> Add a question
          </button>
        </Section>

        <Section title="Policies" text="Linked from the footer and the checkout." icon={<ScrollText />}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Shipping policy">
              <textarea value={s.shippingPolicy} onChange={(e) => set("shippingPolicy", e.target.value)} rows={5} className="input" />
            </Field>
            <Field label="Returns & damage policy">
              <textarea value={s.returnPolicy} onChange={(e) => set("returnPolicy", e.target.value)} rows={5} className="input" />
            </Field>
            <Field label="Care guide" helper="Used for products that don’t have their own care notes." className="md:col-span-2">
              <textarea value={s.careGuide} onChange={(e) => set("careGuide", e.target.value)} rows={3} className="input" />
            </Field>
          </div>
        </Section>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}
