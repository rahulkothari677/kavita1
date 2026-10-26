"use client";

import Link from "next/link";
import { BookOpen, FolderTree, Hammer, House, LayoutGrid, Package, PenTool, Share2 } from "lucide-react";
import { adminBtn, Loading, PageHeader, useLoad } from "@/components/admin/ui";
import { useSettingsForm } from "@/components/admin/useSettings";
import { SaveBar } from "@/components/admin/SaveBar";
import { Field, LoadError, Section } from "@/components/admin/core/form";
import { PhotoSlot, type Shape } from "@/components/admin/PhotoSlot";
import type { Category, HomeTile, MakingStep } from "@/lib/types";

/* The shapes each photo is shown in on the website (width / height). Keep in sync with the store markup. */
// First shape = the main crop; `px` = the size to make a new photo (about 2× the on-screen size, sharp on phones).
const HERO: Shape[] = [
  { label: "Computers", ratio: 2, px: [1920, 960] },
  { label: "Phones", ratio: 16 / 10 },
];
const TILE: Shape[] = [
  { label: "Phones", ratio: 1.4, px: [1120, 800] },
  { label: "Computers", ratio: 1.3 },
];
const ROUND: Shape[] = [{ label: "Round photo", ratio: 1, round: true, px: [800, 800] }];
const STEP: Shape[] = [{ label: "Step photo", ratio: 4 / 3, px: [1200, 900] }];
const COMMISSION: Shape[] = [
  { label: "Tablets and computers", ratio: 4 / 5, px: [1200, 1500] },
  { label: "Phones", ratio: 4 / 3 },
];
const PORTRAIT: Shape[] = [{ label: "About page", ratio: 4 / 5, px: [1200, 1500] }];
const SHARE: Shape[] = [{ label: "Link preview", ratio: 1.91, px: [1200, 630] }];

const FIXED_LINKS = [
  { href: "/shop", label: "All products" },
  { href: "/shop?sort=popular", label: "Bestsellers" },
  { href: "/shop?sort=newest", label: "New arrivals" },
  { href: "/custom-order", label: "Custom orders page" },
  { href: "/gift-finder", label: "Gift finder" },
];

/**
 * Every photo on the website in one place, grouped by page. Each is shown in the shape customers
 * see it, and can be changed, framed (drag + zoom) or put back to the default.
 */
export default function SitePhotosPage() {
  const { s, set, save, saving, dirty, discard, error, reload } = useSettingsForm();
  const cats = useLoad<{ categories: Category[] }>("/api/admin/categories");
  if (!s) return error ? <LoadError message={error} onRetry={reload} /> : <Loading />;

  const flatCats = (cats.data?.categories ?? []).flatMap((c) => [c, ...(c.children ?? [])]);
  const linkOptions = [...flatCats.map((c) => ({ href: `/shop?category=${c.slug}`, label: `Category: ${c.name}` })), ...FIXED_LINKS];

  const hero = s.heroSlides[0];
  const setHeroImage = (image: string) => set("heroSlides", s.heroSlides.map((x, i) => (i === 0 ? { ...x, image } : x)));
  const setTile = (i: number, patch: Partial<HomeTile>) => set("homeTiles", s.homeTiles.map((t, n) => (n === i ? { ...t, ...patch } : t)));
  const setStep = (i: number, patch: Partial<MakingStep>) => set("makingSteps", s.makingSteps.map((t, n) => (n === i ? { ...t, ...patch } : t)));

  return (
    <div className="pb-24 md:pb-8">
      <PageHeader
        title="Site photos"
        subtitle="Every photo on your website. Change it, drag and zoom to frame it, or go back to the default."
        actions={
          <a href="/?shop" target="_blank" rel="noreferrer" className={adminBtn.secondary}>
            Preview website <span aria-hidden>↗</span>
          </a>
        }
      />

      <div className="space-y-6">
        <Section title="Home: top banner" text="The big photo at the top of your homepage. The words on it are in Website content." icon={<House />}>
          {hero ? (
            <PhotoSlot label="Banner photo" help="Wide and bright works best: a piece on a wall in daylight." value={hero.image ?? ""} fallback="/home/hero-scene.webp" shapes={HERO} onChange={setHeroImage} />
          ) : (
            <p className="text-[14px] text-muted">Add a banner in Website content first.</p>
          )}
        </Section>

        <Section title="Home: category tiles" text="The six coloured tiles under the banner. Each has a photo, a title, one line and where it opens." icon={<LayoutGrid />}>
          <ol className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {s.homeTiles.map((t, i) => (
              <li key={i} className="rounded-[8px] border border-admin-line p-4">
                <PhotoSlot compact label={`Tile ${i + 1}`} value={t.image} shapes={TILE} onChange={(image) => setTile(i, { image })} />
                <div className="mt-3 space-y-3">
                  <Field label="Title">
                    <input value={t.title} onChange={(e) => setTile(i, { title: e.target.value })} className="input" />
                  </Field>
                  <Field label="Line under the title">
                    <input value={t.text} onChange={(e) => setTile(i, { text: e.target.value })} className="input" />
                  </Field>
                  <Field label="Opens">
                    <select value={t.link} onChange={(e) => setTile(i, { link: e.target.value })} className="input">
                      {!linkOptions.some((o) => o.href === t.link) && <option value={t.link}>{t.link || "Choose…"}</option>}
                      {linkOptions.map((o) => (
                        <option key={o.href} value={o.href}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Home: About Kavita" text="The round photo in the “About” strip on the homepage. The About page has its own photo below." icon={<House />}>
          <div className="max-w-[220px]">
            <PhotoSlot label="Your photo" help="A friendly photo of you, or your hands at work." value={s.artistImage} fallback="/home/about-studio.webp" shapes={ROUND} onChange={(v) => set("artistImage", v)} />
          </div>
        </Section>

        <Section title="Home: From Clay to Your Wall" text="The four steps that show how a piece is made. Your own work-table photos make this section special." icon={<Hammer />}>
          <ol className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {s.makingSteps.map((m, i) => (
              <li key={i} className="rounded-[8px] border border-admin-line p-4">
                <PhotoSlot compact label={`Step ${i + 1}`} value={m.image} shapes={STEP} onChange={(image) => setStep(i, { image })} />
                <div className="mt-3 space-y-3">
                  <Field label="Title">
                    <input value={m.title} onChange={(e) => setStep(i, { title: e.target.value })} className="input" />
                  </Field>
                  <Field label="Text">
                    <textarea value={m.body} onChange={(e) => setStep(i, { body: e.target.value })} rows={2} className="input" />
                  </Field>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Home: Commissions" text="The photo beside “Made for your home, by name”." icon={<PenTool />}>
          <div className="max-w-[320px]">
            <PhotoSlot
              label="Commissions photo"
              help={s.commissionImage ? undefined : "Right now it is picked automatically from a product marked “customisable”. Add a photo to choose it yourself."}
              value={s.commissionImage}
              fallback=""
              shapes={COMMISSION}
              onChange={(v) => set("commissionImage", v)}
            />
          </div>
        </Section>

        <Section title="About page" text="The tall arched portrait on the Our story page." icon={<BookOpen />}>
          <div className="max-w-[260px]">
            <PhotoSlot
              label="About page photo"
              help={s.aboutPageImage ? undefined : "Showing the brand picture. Add your own tall photo for this page."}
              value={s.aboutPageImage}
              fallback="/brand/brand-board.jpg"
              shapes={PORTRAIT}
              onChange={(v) => set("aboutPageImage", v)}
            />
          </div>
        </Section>

        <Section title="Sharing picture" text="What people see when your website link is shared on WhatsApp, Instagram or Facebook. Product links show that product’s own photo." icon={<Share2 />}>
          <div className="max-w-[360px]">
            <PhotoSlot label="Link preview picture" help="Landscape, about 1200 × 630, with your logo or best piece in the middle." value={s.shareImage} fallback="/brand/brand-board.jpg" shapes={SHARE} onChange={(v) => set("shareImage", v)} />
          </div>
        </Section>

        <Section title="Other photos" text="These live with their own items." icon={<Package />}>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/products" className={adminBtn.secondary}>
              <Package className="size-4" aria-hidden /> Product photos
            </Link>
            <Link href="/admin/categories" className={adminBtn.secondary}>
              <FolderTree className="size-4" aria-hidden /> Category covers (Crafts menu)
            </Link>
          </div>
          <p className="mt-3 text-[13px] text-muted">The Custom orders page shows photos of your products marked “customisable”.</p>
        </Section>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}
