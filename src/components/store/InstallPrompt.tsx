"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Heart, Maximize2, Share, SquarePlus, X, Zap } from "lucide-react";
import { capturedInstall, type InstallPromptEvent, forgetInstall } from "@/components/InstallCapture";

type Mode = "android" | "ios" | "inapp";

const SEEN = "ka_install_seen"; // sessionStorage: asked once this visit
const IOS_SNOOZE = "ka_install_snooze"; // localStorage: iPhone "Not now" rests for a week
const HIDE_ON = [/^\/checkout/, /^\/order\//, /^\/admin/];

const ls = {
  get: (s: Storage, k: string) => {
    try {
      return s.getItem(k);
    } catch {
      return null;
    }
  },
  set: (s: Storage, k: string, v: string) => {
    try {
      s.setItem(k, v);
    } catch {}
  },
};

/**
 * "Get the app" sheet for shoppers who opened a shop link in a browser. A website can't install
 * itself, so this does the next best thing:
 *  - Android / Chrome: one tap on Install opens the phone's own install box.
 *  - iPhone: Apple offers no install button, so it shows the two steps (Share → Add to Home Screen).
 *  - Instagram / Facebook's in-app browser (can't install anything): explains how to open it in the
 *    phone's browser first.
 * Shows a few seconds after the page (and the opening animation) has settled, once per visit.
 * Android: only when Chrome itself offers the install (it stops once the app is installed and offers
 * it again after an uninstall), so no "installed" note of our own can go stale. iPhone can't report
 * whether the app is installed, so "Not now" there rests for a week. Never inside the installed app,
 * on checkout/order pages or in the admin.
 */
export function InstallPrompt() {
  const pathname = usePathname();
  const [evt, setEvt] = useState<InstallPromptEvent | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem("ka_app_installed"); // retired: it went stale after an uninstall
    } catch {}
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    if (standalone || ls.get(sessionStorage, SEEN) === "1") return;

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const inapp = /Instagram|FBAN|FBAV|FB_IAB|Snapchat|Line\//i.test(ua);

    const takeOffer = () => {
      const e = capturedInstall();
      if (!e) return;
      setEvt(e);
      setMode((m) => m ?? "android");
    };
    const onInstalled = () => {
      setEvt(null);
      setOpen(false);
    };
    takeOffer(); // Chrome may have offered it before this code ran (caught by InstallCapture)
    window.addEventListener("ka-installable", takeOffer);
    window.addEventListener("ka-installed", onInstalled);
    if (inapp) setMode("inapp");
    else if (ios && Number(ls.get(localStorage, IOS_SNOOZE) ?? 0) < Date.now()) setMode("ios");

    return () => {
      window.removeEventListener("ka-installable", takeOffer);
      window.removeEventListener("ka-installed", onInstalled);
    };
  }, []);

  // Open a few seconds after the page has settled (the opening animation, if any, has finished).
  const hiddenHere = HIDE_ON.some((r) => r.test(pathname));
  useEffect(() => {
    // Not on checkout/order pages: wait until the shopper is back on a browsing page.
    if (!mode || open || hiddenHere || ls.get(sessionStorage, SEEN) === "1") return;
    let timer = 0;
    const tryOpen = () => {
      const splash = document.documentElement.dataset.splash;
      if (splash === "play" || splash === "out") {
        timer = window.setTimeout(tryOpen, 500);
        return;
      }
      timer = window.setTimeout(() => {
        ls.set(sessionStorage, SEEN, "1");
        setOpen(true);
      }, 4000);
    };
    tryOpen();
    return () => window.clearTimeout(timer);
  }, [mode, open, hiddenHere]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !mode || hiddenHere) return null;

  const install = async () => {
    if (!evt) return;
    forgetInstall();
    await evt.prompt();
    await evt.userChoice;
    setEvt(null);
    setOpen(false);
  };
  const dismiss = () => {
    if (mode === "ios") ls.set(localStorage, IOS_SNOOZE, String(Date.now() + 7 * 24 * 3600 * 1000));
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="install-title"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+100px)] z-[46] mx-auto max-w-md animate-sheet-up rounded-[22px] border border-line bg-surface p-5 shadow-float lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-[380px]"
    >
      <button type="button" onClick={dismiss} aria-label="Close" className="icon-btn absolute top-2 right-2 text-muted hover:text-ink">
        <X className="size-5" strokeWidth={1.75} />
      </button>

      <div className="flex items-center gap-3.5 pr-8">
        <img src="/icon-192.png" alt="" width={56} height={56} className="size-14 shrink-0 rounded-[14px] shadow-soft" />
        <div className="min-w-0">
          <h2 id="install-title" className="font-script text-[24px] leading-tight text-accent">
            Get our app
          </h2>
          <p className="text-[13.5px] leading-snug text-muted">Kavita’s Artistry on your home screen. Free, no app store needed.</p>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { icon: Zap, label: "Opens in one tap" },
          { icon: Maximize2, label: "Full-screen, like an app" },
          { icon: Heart, label: "Bag & wishlist kept" },
        ].map(({ icon: Icon, label }) => (
          <li key={label} className="flex flex-col items-center gap-1.5 rounded-[14px] bg-plinth/70 px-1.5 py-2.5">
            <Icon aria-hidden className="size-[18px] text-accent" strokeWidth={1.75} />
            <span className="text-[11.5px] leading-tight text-ink-2">{label}</span>
          </li>
        ))}
      </ul>

      {mode === "android" && (
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={install} className="btn btn-primary h-12 flex-1">
            Install app
          </button>
          <button type="button" onClick={dismiss} className="btn h-12 px-4 text-muted hover:text-ink">
            Not now
          </button>
        </div>
      )}

      {mode === "ios" && (
        <ol className="mt-4 space-y-2 rounded-[14px] border border-line px-4 py-3 text-[14px] text-ink-2">
          <li className="flex items-center gap-2.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-semibold text-canvas">1</span>
            Tap <Share aria-label="Share" className="inline size-[18px] text-[#0a84ff]" strokeWidth={2} /> Share at the bottom of Safari
          </li>
          <li className="flex items-center gap-2.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-semibold text-canvas">2</span>
            Choose <SquarePlus aria-hidden className="inline size-[18px]" strokeWidth={1.75} /> <b className="font-semibold">Add to Home Screen</b>
          </li>
        </ol>
      )}

      {mode === "inapp" && (
        <p className="mt-4 rounded-[14px] border border-line px-4 py-3 text-[14px] leading-snug text-ink-2">
          This in-app browser can’t install apps. Tap <b className="font-semibold">⋮</b> or <b className="font-semibold">…</b> at the top and choose{" "}
          <b className="font-semibold">Open in browser</b>, then install from there.
        </p>
      )}
    </div>
  );
}
