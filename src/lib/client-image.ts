"use client";

/** Resize + compress a photo in the browser before uploading (phones take 4–12MB photos). */
export async function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bmp = await loadBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
  if (blob && blob.size < file.size) return blob;
  const jpg = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
  return jpg ?? file;
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  }
}

/** Small base64 JPEG for sending to the AI (keeps requests fast and cheap). */
export async function toAiImage(file: Blob, maxDim = 1024): Promise<{ data: string; mime: string }> {
  const blob = await compressImage(new File([file], "x", { type: file.type || "image/jpeg" }), maxDim, 0.8);
  const buf = await blob.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { data: btoa(bin), mime: blob.type || "image/jpeg" };
}

export async function uploadImages(files: Blob[]): Promise<string[]> {
  const out: string[] = [];
  for (const f of files) {
    const fd = new FormData();
    const compressed = f instanceof File ? await compressImage(f) : f;
    const ext = compressed.type.split("/")[1] || "jpg";
    fd.append("file", new File([compressed], `photo.${ext}`, { type: compressed.type }));
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Upload failed");
    out.push(...d.urls);
  }
  return out;
}
