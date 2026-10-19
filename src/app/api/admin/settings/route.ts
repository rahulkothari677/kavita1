import { handler } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";
import { aiProvider } from "@/lib/ai";
import { storageMode } from "@/lib/storage";

export const GET = handler(async () => {
  await requireAdmin();
  return {
    settings: await getSettings(),
    system: {
      ai: aiProvider(),
      storage: storageMode(),
      database: process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL ? "turso" : "local-file",
      onVercel: process.env.VERCEL === "1",
    },
  };
});

export const PUT = handler(async (req: Request) => {
  await requireAdmin();
  await saveSettings(await req.json());
  return { settings: await getSettings() };
});
