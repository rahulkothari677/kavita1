"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { Loading, PageHeader, Panel, Switch, useToast } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettings";
import { SaveBar } from "@/components/admin/SaveBar";
import { uploadImages } from "@/lib/client-image";
import { imgUrl } from "@/lib/format";
import type { HeroSlide } from "@/lib/types";

export default function ContentPage() {
  const { s, set, save, saving, dirty } = useSettingsForm();
  const toast = useToast();
  const [uploading, setUploading] = useState<string | null>(null);
  if (!s) return <Loading />;

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

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Website content" subtitle="Change what customers see — no coding needed." />

      <Panel title="Announcement bar" action={<Switch checked={s.announcementActive} onChange={(v) => set("announcementActive", v)} />}>
        <input value={s.announcement} onChange={(e) => set("announcement", e.target.value)} className="input" placeholder="✨ Free shipping above ₹1999" />
      </Panel>

      <Panel
        title="Homepage hero slides"
        action={
          <button onClick={() => set("heroSlides", [...slides, { id: `h${Date.now()}`, title: "New slide", subtitle: "", eyebrow: "", ctaLabel: "Shop now", ctaLink: "/shop", image: "" }])} className="btn btn-outline btn-sm">
            <Plus className="size-4" /> Add slide
          </button>
        }
      >
        <div className="space-y-5">
          {slides.map((sl, i) => (
            <div key={sl.id} className="grid gap-4 rounded-2xl border border-ink/10 p-4 md:grid-cols-[160px_1fr]">
              <label className="relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-ink/15 bg-tint/40">
                {uploading === sl.id ? <Loader2 className="size-5 animate-spin" /> : sl.image ? <img src={imgUrl(sl.image, 400)} alt="" className="size-full object-cover" /> : <span className="flex flex-col items-center gap-1 text-xs text-muted"><ImagePlus className="size-6" /> Logo shown</span>}
                <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files, (url) => setSlide(i, { image: url }), sl.id)} />
              </label>
              <div className="space-y-2.5">
                <input value={sl.eyebrow ?? ""} onChange={(e) => setSlide(i, { eyebrow: e.target.value })} placeholder="Small text above title" className="input py-2 text-sm" />
                <input value={sl.title} onChange={(e) => setSlide(i, { title: e.target.value })} placeholder="Big headline" className="input font-display text-xl" />
                <textarea value={sl.subtitle ?? ""} onChange={(e) => setSlide(i, { subtitle: e.target.value })} placeholder="Supporting text" rows={2} className="input text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={sl.ctaLabel ?? ""} onChange={(e) => setSlide(i, { ctaLabel: e.target.value })} placeholder="Button text" className="input py-2 text-sm" />
                  <input value={sl.ctaLink ?? ""} onChange={(e) => setSlide(i, { ctaLink: e.target.value })} placeholder="/shop?category=…" className="input py-2 text-sm" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveSlide(i, -1)} className="grid size-8 place-items-center rounded-full hover:bg-ink/5" aria-label="Move up"><ArrowUp className="size-4" /></button>
                  <button onClick={() => moveSlide(i, 1)} className="grid size-8 place-items-center rounded-full hover:bg-ink/5" aria-label="Move down"><ArrowDown className="size-4" /></button>
                  {sl.image && <button onClick={() => setSlide(i, { image: "" })} className="text-xs text-muted underline">Remove image</button>}
                  {slides.length > 1 && (
                    <button onClick={() => set("heroSlides", slides.filter((_, n) => n !== i))} className="ml-auto grid size-8 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label="Delete slide"><Trash2 className="size-4" /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="About / Our story">
        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <label className="relative grid aspect-[4/5] cursor-pointer place-items-center overflow-hidden rounded-t-full rounded-b-2xl border-2 border-dashed border-ink/15 bg-tint/40">
            {uploading === "artist" ? <Loader2 className="size-5 animate-spin" /> : s.artistImage ? <img src={imgUrl(s.artistImage, 400)} alt="" className="size-full object-cover" /> : <span className="flex flex-col items-center gap-1 px-2 text-center text-xs text-muted"><ImagePlus className="size-6" /> Your photo</span>}
            <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files, (url) => set("artistImage", url), "artist")} />
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={s.aboutTitle} onChange={(e) => set("aboutTitle", e.target.value)} placeholder="Title" className="input" />
              <input value={s.artistName} onChange={(e) => set("artistName", e.target.value)} placeholder="Your name (signature)" className="input" />
            </div>
            <textarea value={s.aboutStory} onChange={(e) => set("aboutStory", e.target.value)} rows={8} className="input" />
          </div>
        </div>
      </Panel>

      <Panel title="FAQs" action={<button onClick={() => set("faqs", [...s.faqs, { q: "", a: "" }])} className="btn btn-outline btn-sm"><Plus className="size-4" /> Add</button>}>
        <div className="space-y-3">
          {s.faqs.map((f, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1 space-y-2">
                <input value={f.q} onChange={(e) => set("faqs", s.faqs.map((x, n) => (n === i ? { ...x, q: e.target.value } : x)))} placeholder="Question" className="input font-medium" />
                <textarea value={f.a} onChange={(e) => set("faqs", s.faqs.map((x, n) => (n === i ? { ...x, a: e.target.value } : x)))} placeholder="Answer" rows={2} className="input text-sm" />
              </div>
              <button onClick={() => set("faqs", s.faqs.filter((_, n) => n !== i))} className="self-start p-2 text-muted hover:text-danger" aria-label="Delete FAQ"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Policies">
        <div className="space-y-4">
          <div>
            <label className="label">Shipping policy</label>
            <textarea value={s.shippingPolicy} onChange={(e) => set("shippingPolicy", e.target.value)} rows={3} className="input" />
          </div>
          <div>
            <label className="label">Returns & damage policy</label>
            <textarea value={s.returnPolicy} onChange={(e) => set("returnPolicy", e.target.value)} rows={3} className="input" />
          </div>
          <div>
            <label className="label">Care guide (default for products)</label>
            <textarea value={s.careGuide} onChange={(e) => set("careGuide", e.target.value)} rows={2} className="input" />
          </div>
        </div>
      </Panel>

      <SaveBar dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}
