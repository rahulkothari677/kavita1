"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

/**
 * Keeps a layer mounted long enough to play its exit transition.
 * `visible` flips one frame after mount so CSS transitions run on open as well as close.
 */
export function usePresence(open: boolean, exitMs = 260) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(t);
  }, [open, exitMs]);
  // Render in the same pass that opens, so refs exist when effects run.
  return { mounted: open || mounted, visible };
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
}

/**
 * Modal focus management: moves focus in, keeps Tab inside, closes on Escape,
 * and returns focus to whatever opened the layer.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  { onEscape, initialFocus, trap = true }: { onEscape?: () => void; initialFocus?: RefObject<HTMLElement | null>; trap?: boolean } = {},
) {
  const escRef = useRef(onEscape);
  useEffect(() => {
    escRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    let frame = 0;
    let tries = 0;
    const focusIn = () => {
      const root = ref.current;
      if (!root) {
        if (tries++ < 5) frame = requestAnimationFrame(focusIn);
        return;
      }
      if (root.contains(document.activeElement)) return;
      const target = initialFocus?.current ?? focusables(root)[0] ?? root;
      target.focus({ preventScroll: true });
    };
    frame = requestAnimationFrame(focusIn);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (escRef.current) {
          e.stopPropagation();
          escRef.current();
        }
        return;
      }
      if (!trap || e.key !== "Tab") return;
      const root = ref.current;
      if (!root) return;
      const items = focusables(root);
      if (items.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (!current || !root.contains(current)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      if (previous && previous.isConnected && typeof previous.focus === "function") previous.focus({ preventScroll: true });
    };
    // initialFocus is a ref; reading .current at activation time is intended
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, trap, ref]);
}

/** Locks page scroll while a modal layer is open (restores the previous value). */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

/** SSR-safe media query; false until mounted. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/**
 * Swipe-down-to-dismiss for bottom sheets. Attach the returned handlers to the
 * grabber/header zone and apply `style` to the sheet.
 * Dismisses past 30% of the sheet height or a flick faster than 0.5px/ms.
 */
export function useSwipeDismiss(sheetRef: RefObject<HTMLElement | null>, onDismiss: () => void) {
  const start = useRef<{ y: number; t: number } | null>(null);
  const [dy, setDy] = useState(0);
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") return;
    // Let taps on controls inside the handle (e.g. Close) behave normally.
    if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
    start.current = { y: e.clientY, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!start.current) return;
    setDy(Math.max(0, e.clientY - start.current.y));
  };
  const end = (e: ReactPointerEvent) => {
    if (!start.current) return;
    const dist = Math.max(0, e.clientY - start.current.y);
    const velocity = dist / Math.max(1, performance.now() - start.current.t);
    const h = sheetRef.current?.offsetHeight ?? 1;
    start.current = null;
    setDy(0);
    if (dist > h * 0.3 || velocity > 0.5) onDismiss();
  };
  return {
    dragging: dy > 0,
    style: dy > 0 ? ({ transform: `translateY(${dy}px)`, transition: "none" } as CSSProperties) : undefined,
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
  };
}

/**
 * Height of the on-screen keyboard (0 when closed). Phones put the keyboard over fixed bottom
 * sheets without resizing the page; the visual viewport tells us how much of the screen it covers.
 */
export function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!active || !vv) {
      setInset(0);
      return;
    }
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);
  return inset;
}
