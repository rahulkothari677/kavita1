import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { FacebookIcon as Facebook, InstagramIcon as Instagram, Lotus, WhatsAppIcon, YoutubeIcon as Youtube } from "../Motifs";
import { NewsletterForm } from "./NewsletterForm";
import type { Category, StoreSettings } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src="/brand/medallion.webp" alt="" className="size-14 rounded-full" />
              <div>
                <p className="font-display text-3xl font-semibold leading-none">Kavita&apos;s</p>
                <p className="text-[11px] tracking-[0.35em] text-cream/70">ARTISTRY</p>
              </div>
            </div>
            <p className="mt-5 max-w-xs font-script text-2xl text-gold-2">Art that adds happiness to your space</p>
            <div className="mt-6 flex gap-2">
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noreferrer" className="rounded-full border border-cream/20 p-2.5 hover:bg-cream/10" aria-label="Instagram">
                  <Instagram className="size-4" />
                </a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noreferrer" className="rounded-full border border-cream/20 p-2.5 hover:bg-cream/10" aria-label="Facebook">
                  <Facebook className="size-4" />
                </a>
              )}
              {settings.youtube && (
                <a href={settings.youtube} target="_blank" rel="noreferrer" className="rounded-full border border-cream/20 p-2.5 hover:bg-cream/10" aria-label="YouTube">
                  <Youtube className="size-4" />
                </a>
              )}
              <a href={waLink(settings.whatsappNumber, "Hi Kavita's Artistry! 🌸")} target="_blank" rel="noreferrer" className="rounded-full border border-cream/20 p-2.5 hover:bg-cream/10" aria-label="WhatsApp">
                <WhatsAppIcon className="size-4" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-xs tracking-[0.25em] text-cream/60">SHOP</h4>
            <ul className="space-y-2.5 text-[15px]">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/shop?category=${c.slug}`} className="hover:text-gold-2">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/custom-order" className="hover:text-gold-2">
                  Custom orders
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs tracking-[0.25em] text-cream/60">HELP</h4>
            <ul className="space-y-2.5 text-[15px]">
              <li><Link href="/track" className="hover:text-gold-2">Track your order</Link></li>
              <li><Link href="/faq" className="hover:text-gold-2">FAQs</Link></li>
              <li><Link href="/policies/shipping" className="hover:text-gold-2">Shipping</Link></li>
              <li><Link href="/policies/returns" className="hover:text-gold-2">Returns & damage</Link></li>
              <li><Link href="/policies/care" className="hover:text-gold-2">Care guide</Link></li>
              <li><Link href="/about" className="hover:text-gold-2">Our story</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs tracking-[0.25em] text-cream/60">STAY IN TOUCH</h4>
            <p className="mb-3 text-sm text-cream/75">New collections, festive drops and studio stories — no spam, promise.</p>
            <NewsletterForm />
            <ul className="mt-6 space-y-2 text-sm text-cream/80">
              {settings.phone && <li className="flex items-center gap-2"><Phone className="size-4" /> {settings.phone}</li>}
              {settings.email && <li className="flex items-center gap-2"><Mail className="size-4" /> {settings.email}</li>}
              {settings.address && <li className="flex items-center gap-2"><MapPin className="size-4" /> {settings.address}</li>}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream/15 pt-6 text-xs text-cream/60 md:flex-row">
          <p>© {new Date().getFullYear()} {settings.storeName}. Handmade with love in India.</p>
          <Lotus className="h-5 text-gold-2" />
          <p>Orders confirmed personally on WhatsApp 💛</p>
        </div>
      </div>
    </footer>
  );
}
