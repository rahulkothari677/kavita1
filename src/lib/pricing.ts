/** Pure pricing logic shared by checkout preview (client) and order creation (server). */
export function calcTotals(opts: { subtotal: number; shippingFee: number; freeShippingAbove: number; discount?: number; giftWrapFee?: number; giftWrap?: boolean }) {
  const subtotal = Math.max(0, opts.subtotal);
  const discount = Math.min(opts.discount ?? 0, subtotal);
  const shipping = subtotal === 0 || (opts.freeShippingAbove > 0 && subtotal - discount >= opts.freeShippingAbove) ? 0 : opts.shippingFee;
  const giftWrap = opts.giftWrap ? (opts.giftWrapFee ?? 0) : 0;
  return { subtotal, discount, shipping, giftWrap, total: subtotal - discount + shipping + giftWrap };
}
