"use client";

import { useRef, useState, ViewTransition } from "react";
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Loader2, MoreHorizontal, Star, Trash2 } from "lucide-react";
import { uploadImages } from "@/lib/client-image";
import { imgUrl } from "@/lib/format";
import { Modal, useToast } from "./ui";

type PushToast = (msg: string, kind?: "ok" | "err", action?: { label: string; onClick: () => void }) => void;

/**
 * Product photos: add from camera/gallery, reorder, set cover, delete. The first image is the cover.
 * Plinth tiles (4:5, radius 6px). Desktop shows hover controls; on touch a tap opens a small action sheet.
 */
export function ImageManager({
  images,
  onChange,
  onNewFiles,
  pending = 0,
  coverTransitionName,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  onNewFiles?: (files: File[]) => void;
  /** Uploads started elsewhere (e.g. Snap & Sell) that should show as placeholder tiles. */
  pending?: number;
  /** Shared-element name so the list thumbnail morphs into the cover photo. */
  coverTransitionName?: string;
}) {
  const [uploading, setUploading] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [sheet, setSheet] = useState<number | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const toast = useToast() as unknown as PushToast;

  const add = async (files: FileList | File[] | null) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    onNewFiles?.(list);
    setUploading(list.length);
    try {
      const urls = await uploadImages(list);
      onChange([...images, ...urls]);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "err");
    } finally {
      setUploading(0);
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  const remove = (i: number) => {
    const before = images;
    onChange(images.filter((_, n) => n !== i));
    toast("Photo removed", "ok", { label: "Undo", onClick: () => onChange(before) });
  };

  const waiting = uploading + pending;

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) add(e.dataTransfer.files);
      }}
    >
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-3" aria-label="Product photos">
        {images.map((src, i) => {
          const img = <img src={imgUrl(src, 400)} alt={i === 0 ? "Cover photo" : `Photo ${i + 1}`} loading="lazy" decoding="async" className="size-full object-cover" draggable={false} />;
          return (
            <li
              key={src + i}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragEnd={() => (setDragIdx(null), setOverIdx(null))}
              onDragOver={(e) => (e.preventDefault(), setOverIdx(i))}
              onDrop={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (dragIdx !== null) move(dragIdx, i);
                setDragIdx(null);
                setOverIdx(null);
              }}
              className={`group relative aspect-[4/5] overflow-hidden rounded-[6px] bg-plinth ${dragIdx === i ? "opacity-50" : ""} ${overIdx === i && dragIdx !== null && dragIdx !== i ? "outline-2 outline-offset-2 outline-ink" : ""}`}
            >
              <button type="button" onClick={() => setSheet(i)} className="block size-full cursor-grab active:cursor-grabbing md:cursor-grab" aria-label={`${i === 0 ? "Cover photo" : `Photo ${i + 1}`}: options`}>
                {i === 0 && coverTransitionName ? (
                  <ViewTransition name={coverTransitionName} share="morph" default="none">
                    {img}
                  </ViewTransition>
                ) : (
                  img
                )}
              </button>
              {i === 0 && <span className="pointer-events-none absolute top-1.5 left-1.5 inline-flex h-5 items-center rounded-full bg-white/90 px-2 text-[10.5px] font-semibold tracking-[0.08em] text-ink backdrop-blur-sm">COVER</span>}
              <span className="pointer-events-none absolute right-1.5 bottom-1.5 grid size-7 place-items-center rounded-full bg-white/90 text-ink md:hidden" aria-hidden>
                <MoreHorizontal className="size-4" />
              </span>
              {/* Desktop hover controls */}
              <div className="absolute inset-x-1.5 bottom-1.5 hidden justify-between opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:flex">
                <div className="flex gap-1">
                  <IconBtn label="Move left" onClick={() => move(i, i - 1)} disabled={i === 0}>
                    <ChevronLeft className="size-4" />
                  </IconBtn>
                  <IconBtn label="Move right" onClick={() => move(i, i + 1)} disabled={i === images.length - 1}>
                    <ChevronRight className="size-4" />
                  </IconBtn>
                </div>
                <div className="flex gap-1">
                  {i !== 0 && (
                    <IconBtn label="Make cover" onClick={() => move(i, 0)}>
                      <Star className="size-4" />
                    </IconBtn>
                  )}
                  <IconBtn label="Remove photo" onClick={() => remove(i)}>
                    <Trash2 className="size-4" />
                  </IconBtn>
                </div>
              </div>
            </li>
          );
        })}
        {Array.from({ length: waiting }).map((_, i) => (
          <li key={`u${i}`} className="skeleton grid aspect-[4/5] place-items-center rounded-[6px]!" aria-label="Uploading photo">
            <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
          </li>
        ))}
        <li>
          <button type="button" onClick={() => galleryRef.current?.click()} className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-line-strong bg-white text-[13px] font-medium text-muted transition-colors hover:bg-admin-inset hover:text-ink">
            <ImagePlus className="size-6" aria-hidden />
            Add photos
          </button>
        </li>
        <li className="sm:hidden">
          <button type="button" onClick={() => cameraRef.current?.click()} className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-line-strong bg-white text-[13px] font-medium text-muted transition-colors hover:bg-admin-inset hover:text-ink">
            <Camera className="size-6" aria-hidden />
            Camera
          </button>
        </li>
      </ul>
      <p className="helper">Drag to reorder · the first photo is the cover · photos are compressed for you</p>
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={(e) => (add(e.target.files), (e.target.value = ""))} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => (add(e.target.files), (e.target.value = ""))} />

      <Modal open={sheet !== null} onClose={() => setSheet(null)} title={sheet === 0 ? "Cover photo" : `Photo ${(sheet ?? 0) + 1}`}>
        {sheet !== null && images[sheet] && (
          <div>
            <div className="mx-auto mb-4 aspect-[4/5] w-40 overflow-hidden rounded-[6px] bg-plinth">
              <img src={imgUrl(images[sheet], 400)} alt="" className="size-full object-cover" />
            </div>
            <div className="-mx-2">
              {sheet !== 0 && <Row icon={<Star className="size-5" />} label="Make cover" onClick={() => (move(sheet, 0), setSheet(null))} />}
              {sheet > 0 && <Row icon={<ChevronLeft className="size-5" />} label="Move earlier" onClick={() => (move(sheet, sheet - 1), setSheet(sheet - 1))} />}
              {sheet < images.length - 1 && <Row icon={<ChevronRight className="size-5" />} label="Move later" onClick={() => (move(sheet, sheet + 1), setSheet(sheet + 1))} />}
              <div className="my-1 border-t border-admin-line" />
              <Row icon={<Trash2 className="size-5" />} label="Remove photo" danger onClick={() => (remove(sheet), setSheet(null))} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-h-14 w-full items-center gap-3 rounded-[6px] px-3 text-left text-[15px] font-medium hover:bg-admin-inset ${danger ? "text-danger" : "text-ink"}`}>
      <span aria-hidden className="grid size-6 place-items-center">
        {icon}
      </span>
      {label}
    </button>
  );
}

function IconBtn({ children, onClick, label, disabled }: { children: React.ReactNode; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className="grid size-8 place-items-center rounded-full bg-white/95 text-ink hover:bg-white disabled:opacity-40">
      {children}
    </button>
  );
}
