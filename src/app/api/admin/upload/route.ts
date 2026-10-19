import { handler, bad } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { storeImage } from "@/lib/storage";

export const maxDuration = 60;

export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const form = await req.formData();
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) bad("No file received");
  const urls: string[] = [];
  for (const file of files.slice(0, 12)) {
    if (!file.type.startsWith("image/")) bad("Only images are allowed");
    if (file.size > 8 * 1024 * 1024) bad("Image is too large (max 8MB)");
    urls.push(await storeImage(Buffer.from(await file.arrayBuffer()), file.type, file.name.replace(/\.[^.]+$/, "")));
  }
  return { urls };
});
