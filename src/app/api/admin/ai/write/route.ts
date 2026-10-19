import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { aiJSON, BRAND_VOICE } from "@/lib/ai";
import { dashboardStats } from "@/lib/analytics";
import { getOrder, getProductById, listProducts } from "@/lib/repo";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/format";

export const maxDuration = 60;

/** Admin AI studio: one endpoint, many writing/analysis tasks. */
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const { task, input = {} } = (await req.json()) as { task: string; input: Record<string, string> };
  const s = await getSettings();
  const sys = `${BRAND_VOICE}\nStore: ${s.storeName}. Ordering happens on WhatsApp. Shipping ₹${s.shippingFee}${s.freeShippingAbove ? `, free above ₹${s.freeShippingAbove}` : ""}.`;

  const productText = async (id?: string) => {
    if (!id) return input.productText ?? "";
    const p = await getProductById(id);
    if (!p) return "";
    return `Product: ${p.name}\nPrice: ${formatINR(p.price)}\nCategory: ${p.categoryName ?? "-"}\nSize: ${p.size ?? "-"}\nColours: ${p.colors.join(", ")}\nDescription: ${p.shortDescription}\n${p.description}`;
  };

  switch (task) {
    case "caption": {
      const text = await productText(input.productId);
      return aiJSON<{ caption: string; hashtags: string[]; storyText: string }>(
        sys,
        `Write a ${input.platform || "Instagram"} post in ${input.language || "English"} with a ${input.tone || "warm"} tone for:\n${text}\n${input.extra ? `Extra notes: ${input.extra}` : ""}\nReturn JSON {"caption": post text with line breaks and 2-4 emojis, ending with a call to action to order on WhatsApp / DM, "hashtags": 12-15 relevant hashtags without #, "storyText": very short text overlay for a story/status (max 8 words)}`,
      );
    }
    case "reply": {
      const products = await listProducts({ activeOnly: true, limit: 60 });
      const catalog = products.map((p) => `${p.name} – ${formatINR(p.price)}${p.stock <= 0 && !p.madeToOrder ? " (sold out)" : ""}`).join("\n");
      return aiJSON<{ replies: { label: string; text: string }[] }>(
        `${sys}\nYou help the artist reply to customer messages on WhatsApp/Instagram. Replies must be polite, warm, concise and honest. Use the catalogue for prices. Policies — Shipping: ${s.shippingPolicy} Returns: ${s.returnPolicy}\nCatalogue:\n${catalog}`,
        `Customer message:\n"""${input.message}"""\n${input.context ? `Context from artist: ${input.context}\n` : ""}Reply in the same language as the customer. Return JSON {"replies": [3 options, each {"label": e.g. "Friendly", "Detailed", "Short", "text": reply}]}`,
      );
    }
    case "rewrite": {
      return aiJSON<{ shortDescription: string; description: string }>(
        sys,
        `Improve this product copy. ${input.instruction || "Make it more evocative and premium, keep it honest."}\nName: ${input.name}\nShort description: ${input.shortDescription}\nDescription: ${input.description}\nReturn JSON {"shortDescription": max 180 chars, "description": 2-3 short paragraphs separated by \\n\\n}`,
      );
    }
    case "insights": {
      const st = await dashboardStats(30);
      const data = {
        revenue30d: st.revenue,
        revenuePrev30d: st.revenuePrev,
        orders30d: st.orders,
        ordersPrev30d: st.ordersPrev,
        avgOrderValue: st.aov,
        unpaid: `${st.unpaidCount} orders, ${formatINR(st.unpaidAmount)}`,
        topSelling: st.topProducts,
        mostViewed: st.mostViewed.map((p) => `${p.name} (${p.views} views, ${p.clicks} WhatsApp clicks)`),
        lowStock: st.lowStock.map((p) => `${p.name}: ${p.stock}`),
        customers: st.customers,
        repeatCustomers: st.repeatCustomers,
        newCustomRequests: st.newRequests,
        pendingOrders: st.statusCounts.PENDING ?? 0,
        activeProducts: st.activeProducts,
        today: new Date().toDateString(),
      };
      return aiJSON<{ headline: string; wins: string[]; watch: string[]; actions: { title: string; why: string }[]; festivalTip: string }>(
        `${sys}\nYou are a friendly business coach for a one-woman handmade studio in India. Be specific, practical and encouraging. Use simple English.`,
        `Here is the shop data (INR):\n${JSON.stringify(data, null, 1)}\n\nReturn JSON {"headline": one-sentence summary of how the business is doing, "wins": 2-3 positives, "watch": 1-3 things to watch, "actions": 3-4 concrete actions for this week [{"title","why"}], "festivalTip": tip for the next upcoming Indian festival/season based on today's date}`,
      );
    }
    case "campaign": {
      const products = await listProducts({ activeOnly: true, limit: 60 });
      const catalog = products.map((p) => `${p.name} (${formatINR(p.price)})`).join(", ");
      return aiJSON<{ theme: string; offerIdea: string; couponCode: string; whatsappBroadcast: string; instagramPost: string; productPicks: string[]; contentIdeas: string[] }>(
        sys,
        `Plan a mini marketing campaign for: ${input.occasion || "the upcoming festive season"}.\nProducts: ${catalog}\nReturn JSON {"theme": catchy campaign name, "offerIdea": simple offer suggestion, "couponCode": short uppercase code, "whatsappBroadcast": ready-to-send WhatsApp broadcast message with emojis, "instagramPost": caption with hashtags, "productPicks": 3-5 product names from the list to feature, "contentIdeas": 4 reel/story ideas}`,
      );
    }
    case "order-message": {
      const o = input.orderId ? await getOrder(input.orderId) : null;
      if (!o) bad("Order not found");
      return aiJSON<{ message: string }>(
        sys,
        `Write a short, warm WhatsApp message from Kavita to ${o.customerName} about order ${o.orderNumber} (${o.items.map((i) => i.name).join(", ")}, total ${formatINR(o.total)}, status ${o.status}${o.trackingNumber ? `, tracking ${o.courier ?? ""} ${o.trackingNumber}` : ""}). Purpose: ${input.intent || "a personal thank-you note"}. ${s.upiId ? `UPI ID: ${s.upiId}.` : ""} Return JSON {"message": string}`,
      );
    }
    case "price": {
      const text = await productText(input.productId);
      const products = await listProducts({ limit: 40 });
      return aiJSON<{ suggested: number; range: string; reasoning: string }>(
        `${sys}\nYou are a pricing advisor for premium Indian handmade products.`,
        `${text}\nMaterials cost (optional): ${input.cost || "unknown"}\nHours of work (optional): ${input.hours || "unknown"}\nOther products in store: ${products.map((p) => `${p.name} ₹${p.price}`).join(", ")}\nReturn JSON {"suggested": integer ending in 9, "range": string, "reasoning": 2-3 sentences}`,
      );
    }
    default:
      bad("Unknown AI task");
  }
});
