import type { HomeTextKey, StoreSettings } from "./types";

/** Default wording of the home page; the owner's own wording (settings.homeText) wins when filled in. */
export const HOME_TEXT: Record<HomeTextKey, { label: string; value: string; long?: boolean }> = {
  featuredTitle: { label: "Featured products title", value: "Featured Products" },
  newTitle: { label: "New arrivals title", value: "New Arrivals" },
  makingTitle: { label: "How-it's-made title", value: "From Clay to Your Wall" },
  makingLink: { label: "How-it's-made link", value: "Our story" },
  aboutStripTitle: { label: "About strip title", value: "" },
  aboutButton: { label: "About strip button", value: "My journey" },
  howTitle: { label: "Ordering steps title", value: "How ordering works" },
  commissionLabel: { label: "Commissions small label", value: "Commissions" },
  commissionTitle: { label: "Commissions title", value: "Made for your home, by name" },
  commissionText: { label: "Commissions text", value: "Name plates, wedding and return gifts, or a piece in your colours. Share the idea and we’ll design it together.", long: true },
  commissionButton: { label: "Commissions button", value: "Start a commission" },
  giftTitle: { label: "Gift finder title", value: "Who are you gifting?" },
  giftText: { label: "Gift finder text", value: "Pick an occasion and we’ll suggest handmade pieces that suit it.", long: true },
  reviewsTitle: { label: "Reviews title", value: "From your homes" },
};

/** The owner's wording for a home-page text, else the default. */
export function homeText(s: Pick<StoreSettings, "homeText">, key: HomeTextKey) {
  return s.homeText?.[key]?.trim() || HOME_TEXT[key].value;
}
