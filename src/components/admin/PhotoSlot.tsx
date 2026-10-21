"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Crop, ImagePlus, Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { adminBtn, Modal, useToast } from "./ui";
import { uploadImages } from "@/lib/client-image";
import { imgUrl } from "@/lib/format";
import { DEFAULT_FRAME, frameStyle, splitFrame, withFrame, type Frame } from "@/lib/frame";

/**
 * A box shape the photo is shown in on the website. `ratio` = width / height.
 * The first shape of a slot is the main one; `px` is the size to make a photo for it.
 */
export type Shape = { label: string; ratio: number; round?: boolean; px?: [number, number] };

/** "16:10", "2:1", "4:5"… for the size hint. */
function ratioLabel(r: number) {
  for (let h = 1; h <= 20; h++) {
    const w = r * h;
    if (Math.abs(w - Math.round(w)) < 0.02) return `${Math.round(w)}:${h}`;
  }
  return r.toFixed(2);
}

/** What a narrower/taller shape keeps of a photo made at the main size (centred). */
function safeArea(main: [number, number], r: number): [number, number] {
  const [w, h] = main;
  return r < w / h ? [Math.round(h * r), h] : [w, Math.round(w / r)];
}

function sizeAdvice(shapes: Shape[]) {
  const main = shapes[0];
  if (!main.px) return null;
  const [w, h] = main.px;
  const orient = main.round ? "square, the corners are cut into a circle" : w > h ? "landscape" : w < h ? "portrait" : "square";
  const extras = shapes
    .slice(1)
    .filter((s) => Math.abs(s.ratio - main.ratio) > 0.01)
    .map((s) => ({ label: s.label, area: safeArea(main.px!, s.ratio) }));
  const ai =
    `Make the image exactly ${w} × ${h} pixels (${ratioLabel(main.ratio)}, ${orient}).` +
    (main.round ? " Keep the main subject inside the centre circle." : "") +
    extras.map((e) => ` Keep the main subject inside the central ${e.area[0]} × ${e.area[1]} pixels (${e.label.toLowerCase()} show only that part).`).join("");
  return { w, h, ratio: ratioLabel(main.ratio), orient, extras, ai };
}

/**
 * One photo on the website: shows it in the exact shape customers see, the best size to make
 * it, and Change photo / Adjust (crop) / Use default.
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
  const advice = sizeAdvice(shapes);

  const upload = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setBusy(true);
    try {
      const [url] = await uploadImages([files[0]]);
      onChange(url);
      setEditing(true); // straight into cropping, so the new photo fits its box
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "err");
    } finally {
      setBusy(false);
    }
  };

  const copyAdvice = async () => {
    if (!advice) return;
    try {
      await navigator.clipboard.writeText(advice.ai);
      toast("Copied. Paste it into your AI image tool");
    } catch {
      toast(advice.ai);
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

      {advice && (
        <div className="mt-2 rounded-[6px] bg-admin-inset px-3 py-2 text-[12.5px] leading-snug">
          <p>
            <span className="font-semibold">Best size: {advice.w} × {advice.h} px</span>{" "}
            <span className="text-muted">
              ({advice.ratio}, {advice.orient})
            </span>
          </p>
          {advice.extras.map((e) => (
            <p key={e.label} className="mt-0.5 text-muted">
              {e.label} show the middle {e.area[0]} × {e.area[1]} px. Keep the main subject there.
            </p>
          ))}
          <button type="button" onClick={copyAdvice} className="mt-1 inline-flex min-h-8 items-center gap-1.5 font-medium text-ink underline underline-offset-2">
            <Copy className="size-3.5" aria-hidden /> Copy for AI
          </button>
        </div>
      )}

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
        <CropEditor
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

/* ── Crop editor ──────────────────────────────────────────────────────
 * Shows the whole photo with a crop frame in the box's shape. Drag an edge to cut from that side,
 * a corner to resize from it, the middle to move it; the slider zooms around the centre.
 *
 * The crop is stored as a Frame (x, y = object-position %, z = zoom), which is what the website
 * applies. For a box whose cover-fit shows a w0 × h0 share of the photo, zoom z shows w = w0/z,
 * and object-position x keeps the left edge at L = x·(1 − w). So: z = w0/w, x = L/(1 − w).
 */
type Rect = { l: number; t: number; w: number; h: number }; // fractions of the photo
type Mode = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const MAX_ZOOM = 4;

/** Share of the photo a box of `ratio` shows at zoom 1 (object-fit: cover). */
function coverShare(imgRatio: number, ratio: number) {
  return { w0: Math.min(1, ratio / imgRatio), h0: Math.min(1, imgRatio / ratio) };
}
function frameToRect(f: Frame, imgRatio: number, ratio: number): Rect {
  const { w0, h0 } = coverShare(imgRatio, ratio);
  const w = w0 / f.z;
  const h = h0 / f.z;
  return { w, h, l: (f.x / 100) * (1 - w), t: (f.y / 100) * (1 - h) };
}
function rectToFrame(r: Rect, imgRatio: number, ratio: number): Frame {
  const { w0 } = coverShare(imgRatio, ratio);
  return {
    z: clamp(w0 / r.w, 1, MAX_ZOOM),
    x: r.w < 0.999 ? clamp((r.l / (1 - r.w)) * 100, 0, 100) : 50,
    y: r.h < 0.999 ? clamp((r.t / (1 - r.h)) * 100, 0, 100) : 50,
  };
}

function CropEditor({ title, src, shapes, onClose, onDone }: { title: string; src: string; shapes: Shape[]; onClose: () => void; onDone: (url: string) => void }) {
  const { src: base, frame: start } = splitFrame(src);
  const main = shapes[0];
  const [imgRatio, setImgRatio] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: Mode; x: number; y: number; r: Rect } | null>(null);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const ir = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight;
    setImgRatio(ir);
    setRect(frameToRect(start, ir, main.ratio));
  };

  const frame = imgRatio && rect ? rectToFrame(rect, imgRatio, main.ratio) : start;
  const preview = withFrame(base, frame);

  // Width/height link of the crop frame, in photo fractions: h = w · k
  const k = imgRatio ? imgRatio / main.ratio : 1;
  const wMax = imgRatio ? coverShare(imgRatio, main.ratio).w0 : 1;
  const wMin = wMax / MAX_ZOOM;

  /** Resize keeping the given anchor (fractions inside the rect: 0 = left/top, 1 = right/bottom). */
  const resize = (r: Rect, w: number, ax: number, ay: number): Rect => {
    const nw = clamp(w, wMin, wMax);
    const nh = nw * k;
    const l = clamp(r.l + (r.w - nw) * ax, 0, 1 - nw);
    const t = clamp(r.t + (r.h - nh) * ay, 0, 1 - nh);
    return { l, t, w: nw, h: nh };
  };

  const onDown = (mode: Mode) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!rect) return;
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // capture only keeps the drag going outside the frame; never let it stop the gesture
    }
    drag.current = { mode, x: e.clientX, y: e.clientY, r: rect };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const box = wrapRef.current?.getBoundingClientRect();
    if (!d || !box) return;
    const dx = (e.clientX - d.x) / box.width;
    const dy = (e.clientY - d.y) / box.height;
    const r = d.r;
    let next: Rect;
    switch (d.mode) {
      case "move":
        next = { ...r, l: clamp(r.l + dx, 0, 1 - r.w), t: clamp(r.t + dy, 0, 1 - r.h) };
        break;
      case "e": next = resize(r, r.w + dx, 0, 0.5); break; // left edge stays
      case "w": next = resize(r, r.w - dx, 1, 0.5); break; // right edge stays
      case "s": next = resize(r, (r.h + dy) / k, 0.5, 0); break; // top edge stays
      case "n": next = resize(r, (r.h - dy) / k, 0.5, 1); break; // bottom edge stays
      case "se": next = resize(r, r.w + (dx + dy / k) / 2, 0, 0); break;
      case "nw": next = resize(r, r.w - (dx + dy / k) / 2, 1, 1); break;
      case "ne": next = resize(r, r.w + (dx - dy / k) / 2, 0, 1); break;
      case "sw": next = resize(r, r.w + (-dx + dy / k) / 2, 1, 0); break;
    }
    setRect(next);
  };
  const onUp = () => {
    drag.current = null;
  };

  const zoom = imgRatio && rect ? wMax / rect.w : 1;
  const setZoom = (z: number) => rect && setRect(resize(rect, wMax / clamp(z, 1, MAX_ZOOM), 0.5, 0.5));

  // Dashed outlines: what each other box shape shows with this crop (same x, y, zoom).
  const others =
    imgRatio && rect
      ? shapes.slice(1).filter((s) => Math.abs(s.ratio - main.ratio) > 0.01).map((s) => ({ label: s.label, r: frameToRect(frame, imgRatio, s.ratio) }))
      : [];

  const pct = (n: number) => `${n * 100}%`;
  const handle = "absolute z-[2] grid place-items-center touch-none";
  const knob = "block rounded-full border-2 border-white bg-ink shadow";

  return (
    <Modal open onClose={onClose} title={title} wide>
      <p className="text-[13px] text-muted">
        Drag an <b className="text-ink">edge</b> to cut from that side only, a <b className="text-ink">corner</b> to resize, or the <b className="text-ink">middle</b> to move. Your original photo is kept.
      </p>

      <div className="mt-3 flex justify-center">
        <div
          ref={wrapRef}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="relative touch-none overflow-hidden rounded-[6px] bg-plinth select-none"
          style={{ aspectRatio: imgRatio ?? 1.5, width: imgRatio ? `min(100%, calc(52vh * ${imgRatio}))` : "100%" }}
        >
          <img src={imgUrl(base, 1200)} alt="" draggable={false} onLoad={onImgLoad} className="pointer-events-none size-full object-contain" />
          {rect && (
            <>
              {others.map((o) => (
                <span
                  key={o.label}
                  aria-hidden
                  className="pointer-events-none absolute z-[1] border border-dashed border-white/90"
                  style={{ left: pct(o.r.l), top: pct(o.r.t), width: pct(o.r.w), height: pct(o.r.h) }}
                >
                  <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10.5px] text-white">{o.label}</span>
                </span>
              ))}
              <div
                onPointerDown={onDown("move")}
                className={`absolute cursor-move shadow-[0_0_0_9999px_rgb(0_0_0/0.55)] outline-2 outline-white ${main.round ? "rounded-full" : ""}`}
                style={{ left: pct(rect.l), top: pct(rect.t), width: pct(rect.w), height: pct(rect.h) }}
              >
                {/* edges: wide invisible grab strips with a visible bar in the middle */}
                <span onPointerDown={onDown("n")} className={`${handle} inset-x-6 -top-3 h-6 cursor-ns-resize`}><span className={`${knob} h-1.5 w-8`} /></span>
                <span onPointerDown={onDown("s")} className={`${handle} inset-x-6 -bottom-3 h-6 cursor-ns-resize`}><span className={`${knob} h-1.5 w-8`} /></span>
                <span onPointerDown={onDown("w")} className={`${handle} inset-y-6 -left-3 w-6 cursor-ew-resize`}><span className={`${knob} h-8 w-1.5`} /></span>
                <span onPointerDown={onDown("e")} className={`${handle} inset-y-6 -right-3 w-6 cursor-ew-resize`}><span className={`${knob} h-8 w-1.5`} /></span>
                {/* corners */}
                <span onPointerDown={onDown("nw")} className={`${handle} -top-3 -left-3 size-6 cursor-nwse-resize`}><span className={`${knob} size-3.5`} /></span>
                <span onPointerDown={onDown("ne")} className={`${handle} -top-3 -right-3 size-6 cursor-nesw-resize`}><span className={`${knob} size-3.5`} /></span>
                <span onPointerDown={onDown("sw")} className={`${handle} -bottom-3 -left-3 size-6 cursor-nesw-resize`}><span className={`${knob} size-3.5`} /></span>
                <span onPointerDown={onDown("se")} className={`${handle} -right-3 -bottom-3 size-6 cursor-nwse-resize`}><span className={`${knob} size-3.5`} /></span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-[560px] items-center gap-3">
        <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-admin-sidebar" onClick={() => setZoom(zoom - 0.1)} aria-label="Zoom out">
          <ZoomOut className="size-5" />
        </button>
        <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="min-w-0 flex-1 accent-ink" aria-label="Zoom" />
        <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-admin-sidebar" onClick={() => setZoom(zoom + 0.1)} aria-label="Zoom in">
          <ZoomIn className="size-5" />
        </button>
      </div>

      <div className="mt-5">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">How it will look</p>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          {shapes.map((s) => (
            <div key={s.label} className="w-[150px]">
              <div className={`overflow-hidden bg-plinth ${s.round ? "rounded-full" : "rounded-[6px]"}`} style={{ aspectRatio: s.ratio }}>
                <img src={imgUrl(base, 480)} alt="" className="size-full object-cover" style={frameStyle(preview)} />
              </div>
              <p className="mt-1 text-[12px] text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className={adminBtn.ghost} onClick={() => imgRatio && setRect(frameToRect(DEFAULT_FRAME, imgRatio, main.ratio))}>
          <RotateCcw className="size-4" aria-hidden /> Reset
        </button>
        <button type="button" className={adminBtn.secondary} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={adminBtn.primary} onClick={() => onDone(preview)} disabled={!rect}>
          Done
        </button>
      </div>
    </Modal>
  );
}
