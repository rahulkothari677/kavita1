import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminPassword, isAdmin } from "@/lib/auth";
import { Wordmark } from "@/components/brand";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio login", robots: { index: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const setup = !(await hasAdminPassword());
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[400px] rounded-[8px] border border-line bg-surface p-6 sm:p-8">
        <Wordmark />
        <p className="eyebrow mt-6">{setup ? "Studio · first visit" : "Studio"}</p>
        <h1 className="font-display mt-3 text-[32px] leading-[1.1] font-[360] tracking-[-0.015em] text-ink">
          {setup ? (
            <>
              Welcome, <em>Kavita</em>
            </>
          ) : (
            <>
              Welcome <em>back</em>
            </>
          )}
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-muted">
          {setup ? "Create a password to protect your studio. You’ll use it to log in from any device." : "Log in to look after your orders, pieces and shop."}
        </p>
        <LoginForm setup={setup} />
      </div>
      <a href="/?shop" className="link mt-6 text-[14px] text-muted">
        <span className="arrow">←</span> Back to the shop
      </a>
    </main>
  );
}
