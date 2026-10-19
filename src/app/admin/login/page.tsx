import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminPassword, isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { MirrorRing } from "@/components/Motifs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const setup = !(await hasAdminPassword());
  return (
    <div className="grid min-h-screen bg-ink lg:grid-cols-2">
      <div className="relative hidden items-center justify-center overflow-hidden lg:flex">
        <MirrorRing className="absolute size-[640px] animate-spin-slow opacity-30" count={22} />
        <div className="relative text-center text-on-ink">
          <img src="/brand/medallion.webp" alt="" className="mx-auto size-56 rounded-full shadow-2xl" />
          <p className="mt-8 font-script text-4xl text-accent-soft">Art that adds happiness</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-sm">
          <img src="/brand/medallion.webp" alt="" className="mx-auto size-20 rounded-full shadow-lg lg:hidden" />
          <h1 className="mt-6 font-display text-4xl font-semibold">{setup ? "Welcome, Kavita!" : "Studio admin"}</h1>
          <p className="mt-2 text-sm text-muted">{setup ? "Create a password to protect your shop's admin panel. You'll use it to log in from any device." : "Log in to manage your shop."}</p>
          <LoginForm setup={setup} />
        </div>
      </div>
    </div>
  );
}
