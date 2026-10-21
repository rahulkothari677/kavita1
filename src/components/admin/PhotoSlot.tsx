"use client";

import { useEffect, useRef, useState } from "react";
import { Crop, ImagePlus, Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { adminBtn, Modal, useToast } from "./ui";
import { uploadImages } from "@/lib/client-image";
import { imgUrl } from "@/lib/format";
import { DEFAULT_FRAME, frameStyle, splitFrame, withFrame, type Frame } from "@/lib/frame";

/** A box shape the photo is shown in on the website. `ratio` = width / height. */
export type Shape = { label: string; ratio: number; round?: boolean };

/**
 * One photo on the website: shows it in the exact shape customers see, with
 * Change photo / Adjust (drag + pinch to frame it) / Use default.
 * `value` empty = the site uses `fallback`, which is shown here too so nothing looks missing.
 */
export function PhotoSlot({
  label,
  help,
  value,
  fallback,
  shapes,
  onChange,
  compact = false,
}: {
  label: string;
  help?: string;
  value: string;
  fallback?: string;
  shapes: Shape[];
  onChange: (url: string) => void;
  compact?: boolean;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const current = value || fallback || "";
  const usingDefault = !value && !!fallback;
  const main = shapes[0];

  const upload = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setBusy(true);
    try {
      const [url] = await uploadImages([files[0]]);
      onChange(url);
      setEditing(true); // straight into framing, so the new photo fits its box
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-w-0">
      <p className="text-[14px] font-semibold">{label}</p>
      {help && <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{help}</p>}
      <div
        className={`relative mt-2 overflow-hidden border border-admin-line bg-plinth ${main.round ? "rounded-full" : "rounded-[8px]"} ${compact ? "w-full" : "w-full max-w-[320px]"}`}
        style={{ aspectRatio: main.ratio }}
      >
        {busy ? (
          <span className="absolute inset-0 grid place-items-center">
            <Loader2 className="size-5 animate-spin text-muted" aria-label="Uploading" />
          </span>
        ) : current ? (
          <img src={imgUrl(current, 640)} alt="" className="size-full object-cover" style={frameStyle(current)} />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-[12px] text-muted">No photo</span>
        )}
        {usingDefault && !busy && <span className="absolute top-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink">Default photo</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className={`${adminBtn.secondary} cursor-pointer focus-within:outline-2 focus-within:outline-accent`}>
          <ImagePlus className="size-4" aria-hidden /> {current ? "Change photo" : "Add photo"}
          <input type="file" accept="image/*" className="sr-only" aria-label={`Upload a photo for ${label}`} onChange={(e) => upload(e.target.files)} />
        </label>
        {current && (
          <button type="button" className={adminBtn.secondary} onClick={() => setEditing(true)}>
            <Crop className="size-4" aria-hidden /> Adjust
          </button>
        )}
        {value && fallback !== undefined && (
          <button type="button" className={adminBtn.ghost} onClick={() => onChange("")}>
            <RotateCcw className="size-4" aria-hidden /> Use default
          </button>
        )}
      </div>
      {editing && current && (
        <FrameEditor
          title={`Adjust: ${label}`}
          src={current}
          shapes={shapes}
          onClose={() => setEditing(false)}
          onDone={(url) => {
            onChange(url);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

/** Drag to choose what stays in view, pinch / slider / mouse wheel to zoom. Previews every shape. */
function FrameEditor({ title, src, shapes, onClose, onDone }: { title: string; src: string; shapes: Shape[]; onClose: () => void; onDone: (url: string) => void }) {
  const { src: base, frame: start } = splitFrame(src);
  const [f, setF] = useState<Frame>(start);
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; z: number } | null>(null);
  const main = shapes[0];
  const preview = withFrame(base, f);

  /** How far the photo overflows the box (px) at the current zoom: drag distance → % moved. */
  const overflow = () => {
    const box = boxRef.current?.getBoundingClientRect();
    const img = imgRef.current;
    if (!box || !img?.naturalWidth) return { ox: 1, oy: 1 };
    const s = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
    return { ox: Math.max(1, img.naturalWidth * s * f.z - box.width), oy: Math.max(1, img.naturalHeight * s * f.z - box.height) };
  };
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
  const zoomTo = (z: number) => setF((p) => ({ ...p, z: clamp(Math.round(z * 100) / 100, 1, 3) }));

  const onDown = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nicety (keeps the drag going outside the box); never let it stop the gesture.
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), z: f.z };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      zoomTo((pinch.current.z * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.dist);
      return;
    }
    const { ox, oy } = overflow();
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    // Dragging the photo right reveals more of its left side, so the focus point moves left.
    setF((p) => ({ ...p, x: clamp(p.x - (dx / ox) * 100, 0, 100), y: clamp(p.y - (dy / oy) * 100, 0, 100) }));
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  // Mouse wheel / trackpad zoom (desktop); passive:false so the page doesn't scroll instead.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setF((p) => ({ ...p, z: Math.min(3, Math.max(1, Math.round((p.z - e.deltaY * 0.002) * 100) / 100)) }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <Modal open onClose={onClose} title={title} wide>
      <p className="text-[13px] text-muted">Drag the photo to choose what shows. Pinch, use the slider or scroll to zoom. Your original photo is kept.</p>
      <div className="mt-3 flex justify-center">
        <div
          ref={boxRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={`relative w-full cursor-grab touch-none overflow-hidden bg-plinth select-none active:cursor-grabbing ${main.round ? "max-w-[300px] rounded-full" : "max-w-[560px] rounded-[10px]"}`}
          style={{ aspectRatio: main.ratio, maxHeight: "52vh" }}
        >
          <img ref={imgRef} src={imgUrl(base, 1200)} alt="" draggable={false} className="pointer-events-none size-full object-cover" style={frameStyle(preview)} />
          {/* rule-of-thirds guide */}
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_33.2%,rgb(255_255_255/0.45)_33.3%,transparent_33.6%,transparent_66.5%,rgb(255_255_255/0.45)_66.6%,transparent_66.9%),linear-gradient(to_bottom,transparent_33.2%,rgb(255_255_255/0.45)_33.3%,transparent_33.6%,transparent_66.5%,rgb(255_255_255/0.45)_66.6%,transparent_66.9%)]" />
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-[560px] items-center gap-3">
        <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-admin-sidebar" onClick={() => zoomTo(f.z - 0.1)} aria-label="Zoom out">
          <ZoomOut className="size-5" />
        </button>
        <input type="range" min={1} max={3} step={0.01} value={f.z} onChange={(e) => zoomTo(Number(e.target.value))} className="min-w-0 flex-1 accent-ink" aria-label="Zoom" />
        <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-admin-sidebar" onClick={() => zoomTo(f.z + 0.1)} aria-label="Zoom in">
          <ZoomIn className="size-5" />
        </button>
      </div>

      {shapes.length > 1 && (
        <div className="mt-5">
          <p className="text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">Also shown as</p>
          <div className="mt-2 flex flex-wrap items-end gap-4">
            {shapes.slice(1).map((s) => (
              <div key={s.label} className="w-[140px]">
                <div className={`overflow-hidden bg-plinth ${s.round ? "rounded-full" : "rounded-[6px]"}`} style={{ aspectRatio: s.ratio }}>
                  <img src={imgUrl(base, 480)} alt="" className="size-full object-cover" style={frameStyle(preview)} />
                </div>
                <p className="mt-1 text-[12px] text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className={adminBtn.ghost} onClick={() => setF(DEFAULT_FRAME)}>
          <RotateCcw className="size-4" aria-hidden /> Reset
        </button>
        <button type="button" className={adminBtn.secondary} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={adminBtn.primary} onClick={() => onDone(preview)}>
          Done
        </button>
      </div>
    </Modal>
  );
}
