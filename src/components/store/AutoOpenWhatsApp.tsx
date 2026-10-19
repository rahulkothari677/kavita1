"use client";

import { useEffect } from "react";

/** After checkout on mobile: open WhatsApp once, so "back" returns to the thank-you page. */
export function AutoOpenWhatsApp({ url, orderNumber }: { url: string; orderNumber: string }) {
  useEffect(() => {
    const key = `ka_wa_opened_${orderNumber}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    const t = setTimeout(() => (window.location.href = url), 600);
    return () => clearTimeout(t);
  }, [url, orderNumber]);
  return (
    <p role="status" className="sr-only">
      Opening WhatsApp so you can send your order.
    </p>
  );
}
