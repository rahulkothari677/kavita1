import { StoreProvider, type PublicSettings } from "@/components/store/StoreProvider";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { FloatingActions } from "@/components/store/FloatingActions";
import { getSettings } from "@/lib/settings";
import { categoryTree } from "@/lib/repo";
import { aiProvider } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), categoryTree({ activeOnly: true })]);
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
  };
  return (
    <StoreProvider settings={pub}>
      <div className="paper-grain min-h-screen">
        <Header categories={categories} announcement={settings.announcementActive ? settings.announcement : null} />
        {!settings.acceptingOrders && (
          <div className="bg-gold-2/30 px-4 py-2.5 text-center text-sm text-ink">{settings.vacationMessage}</div>
        )}
        <main>{children}</main>
        <Footer settings={settings} categories={categories} />
      </div>
      <CartDrawer />
      <FloatingActions />
    </StoreProvider>
  );
}
