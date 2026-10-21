/**
 * "Fly to bag": a small copy of the product photo arcs from where it was tapped into the
 * visible bag icon (header on desktop, tab bar on phones). Pure Web Animations; skipped
 * for reduced-motion users or when either end is off screen.
 */
export function flyToBag(from: Element | null | undefined) {
  if (typeof window === "undefined" || !from) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const img = from instanceof HTMLImageElement ? from : from.querySelector("img");
  const target = [...document.querySelectorAll<HTMLElement>("[data-bag-target]")].find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
  });
  if (!img || !target) return;

  const a = img.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(a.width, a.height, 120);
  const ghost = document.createElement("img");
  ghost.src = img.currentSrc || img.src;
  ghost.alt = "";
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${a.left + a.width / 2 - size / 2}px`,
    top: `${a.top + a.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "cover",
    borderRadius: "999px",
    zIndex: "150",
    pointerEvents: "none",
    boxShadow: "0 10px 30px rgb(0 0 0 / 0.25)",
  });
  document.body.appendChild(ghost);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const lift = Math.min(-60, dy * 0.35); // arc upward first
  // Never leave the copy behind if the browser pauses animations (background tab, low power).
  setTimeout(() => ghost.remove(), 1200);
  ghost
    .animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.45}px, ${lift}px) scale(0.7)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.4 },
      ],
      { duration: 650, easing: "cubic-bezier(.45,.05,.3,1)" },
    )
    .finished.finally(() => {
      ghost.remove();
      target.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 300, easing: "ease-out" });
    });
}
