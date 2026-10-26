/**
 * The customer-facing shop address, for share links made inside the admin. The admin may be open on
 * its own address (e.g. kavita1-admin.vercel.app or admin.example.in), which must never be shared.
 * NEXT_PUBLIC_SITE_URL wins when set (a custom domain); otherwise the admin part is taken off the host.
 */
export function shopOrigin(currentOrigin: string): string {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fixed) return fixed;
  if (!currentOrigin) return "";
  try {
    const u = new URL(currentOrigin);
    u.hostname = u.hostname.replace(/-admin(?=\.)/, "").replace(/^admin\./, "");
    return u.origin;
  } catch {
    return currentOrigin;
  }
}
