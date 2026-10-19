import { StoreProvider, type PublicSettings } from "@/components/store/StoreProvider";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { FloatingActions } from "@/components/store/FloatingActions";
import { MobileTabBar } from "@/components/store/MobileTabBar";
import { QuickView } from "@/components/store/QuickView";
import { AnnouncementBar } from "@/components/store/chrome/AnnouncementBar";
import { getSettings } from "@/lib/settings";
import { categoryTree } from "@/lib/repo";
import { aiProvider } from "@/lib/ai";
import { cookies } from "next/headers";
import Link from "next/link";
import { getTheme, themeCss } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, jar] = await Promise.all([getSettings(), categoryTree({ activeOnly: true }), cookies()]);
  const previewId = jar.get("ka_theme_preview")?.value;
  const preview = previewId ? getTheme(previewId) : null;
  const theme = preview ?? getTheme(settings.theme);
  const pub: PublicSettings = {
    storeName: settings.storeName,
    whatsappNumber: settings.whatsappNumber,
    shippingFee: settings.shippingFee,
    freeShippingAbove: settings.freeShippingAbove,
    giftWrapFee: settings.giftWrapFee,
    acceptingOrders: settings.acceptingOrders,
    vacationMessage: settings.vacationMessage,
    aiAssistantEnabled: settings.aiAssistantEnabled,
    aiAssistantName: settings.aiAssistantName,
    aiAvailable: aiProvider() !== null,
    instagram: settings.instagram,
    codAvailable: settings.codAvailable,
  };
  return (
    <StoreProvider settings={pub}>
      <style dangerouslySetInnerHTML={{ __html: themeCss(theme.id) }} />
      <div className="flex min-h-screen flex-col">
        {preview && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink px-4 py-2 text-center text-[13px] text-canvas">
            <span>
              Previewing the <b>{preview.name}</b> theme — only you can see this.
            </span>
            <Link href="/admin/settings#appearance" className="underline underline-offset-2">
              Apply in settings
            </Link>
            <a href="/api/theme-preview?theme=off" className="underline underline-offset-2">
              Exit preview
            </a>
          </div>
        )}
        <a
          href="#main"
          className="sr-only z-[90] rounded-[4px] bg-ink px-4 py-3 text-[14px] font-medium text-canvas focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <AnnouncementBar text={settings.announcementActive ? settings.announcement : null} codAvailable={settings.codAvailable} />
        <Header categories={categories} />
        {!settings.acceptingOrders && settings.vacationMessage && (
          <div role="note" className="border-b border-line bg-plinth">
            <p className="container-x flex items-center justify-center gap-2.5 py-2.5 text-center text-[14px] text-ink-2">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
              {settings.vacationMessage}
            </p>
          </div>
        )}
        {/* Below lg the tab bar (64px + safe area) floats over the page bottom */}
        <main id="main" tabIndex={-1} className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom)+16px)] outline-none lg:pb-16">
          {children}
        </main>
        <Footer settings={settings} categories={categories} />
      </div>
      <CartDrawer />
      <FloatingActions />
      <MobileTabBar />
      <QuickView />
    </StoreProvider>
  );
}
