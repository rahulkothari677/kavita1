"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Star, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { uploadImages } from "@/lib/client-image";
import { imgUrl } from "@/lib/format";
import { useToast } from "./ui";

/** Product photos: add from camera/gallery, reorder, set cover, delete. The first image is the cover. */
export function ImageManager({ images, onChange, onNewFiles }: { images: string[]; onChange: (urls: string[]) => void; onNewFiles?: (files: File[]) => void }) {
  const [uploading, setUploading] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

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
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) add(e.dataTransfer.files);
      }}
    >
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((src, i) => (
          <div
            key={src + i}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.stopPropagation();
              if (dragIdx !== null) move(dragIdx, i);
              setDragIdx(null);
            }}
            className={`group relative aspect-square overflow-hidden rounded-xl bg-tint ${i === 0 ? "ring-2 ring-accent" : ""}`}
          >
            <img src={imgUrl(src, 300)} alt="" className="size-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">COVER</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <div className="flex gap-1">
                <IconBtn label="Move left" onClick={() => move(i, i - 1)}>
                  <ChevronLeft className="size-3.5" />
                </IconBtn>
                <IconBtn label="Move right" onClick={() => move(i, i + 1)}>
                  <ChevronRight className="size-3.5" />
                </IconBtn>
              </div>
              <div className="flex gap-1">
                {i !== 0 && (
                  <IconBtn label="Make cover" onClick={() => move(i, 0)}>
                    <Star className="size-3.5" />
                  </IconBtn>
                )}
                <IconBtn label="Delete" onClick={() => onChange(images.filter((_, n) => n !== i))}>
                  <Trash2 className="size-3.5" />
                </IconBtn>
              </div>
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`u${i}`} className="grid aspect-square place-items-center rounded-xl bg-tint">
            <Loader2 className="size-6 animate-spin text-ink/40" />
          </div>
        ))}
        <button type="button" onClick={() => galleryRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink/15 text-xs text-muted hover:border-ink/40 hover:text-ink">
          <ImagePlus className="size-6" />
          Add photos
        </button>
        <button type="button" onClick={() => cameraRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink/15 text-xs text-muted hover:border-ink/40 hover:text-ink sm:hidden">
          <Camera className="size-6" />
          Camera
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">Drag to reorder · first photo is the cover · photos are auto-compressed</p>
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={(e) => (add(e.target.files), (e.target.value = ""))} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => (add(e.target.files), (e.target.value = ""))} />
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="grid size-7 place-items-center rounded-full bg-white/90 text-ink hover:bg-white">
      {children}
    </button>
  );
}
