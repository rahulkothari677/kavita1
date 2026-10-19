import { v2 as cloudinary } from "cloudinary";
import { put } from "@vercel/blob";
import { newId, nowIso, run } from "./db";

/**
 * Image storage, in order of preference:
 *  1. Cloudinary (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET) – auto-resizing CDN
 *  2. Vercel Blob (BLOB_READ_WRITE_TOKEN – added automatically when you create a Blob store in Vercel)
 *  3. Database fallback – stored in the ImageBlob table and served from /api/img/[id]
 */
export function storageMode() {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) return "cloudinary";
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return "database";
}

export async function storeImage(buf: Buffer, mime: string, nameHint = "image"): Promise<string> {
  const mode = storageMode();
  if (mode === "cloudinary") {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const res = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "kavitas-artistry", resource_type: "image" }, (err, result) => {
          if (err || !result) reject(err ?? new Error("Upload failed"));
          else resolve(result as { secure_url: string });
        })
        .end(buf);
    });
    return res.secure_url;
  }
  if (mode === "blob") {
    const ext = mime.split("/")[1] || "jpg";
    const blob = await put(`products/${nameHint.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "image"}.${ext}`, buf, {
      access: "public",
      contentType: mime,
      addRandomSuffix: true,
    });
    return blob.url;
  }
  if (buf.length > 1_500_000) throw new Error("Image too large for database storage. Please use a smaller photo or configure Cloudinary.");
  const id = newId("img_");
  await run("INSERT INTO ImageBlob (id, mime, data, createdAt) VALUES (?,?,?,?)", [id, mime, buf.toString("base64"), nowIso()]);
  return `/api/img/${id}`;
}
