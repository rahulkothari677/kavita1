"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { capturedInstall, type InstallPromptEvent, forgetInstall } from "./InstallCapture";

/**
 * "Install app" button for the shop or Studio Admin. Uses the browser's own install prompt when it is
 * offered; otherwise shows one short line on what to do (iPhone, already installed, or — for the admin —
 * the separate admin address, because Chrome counts every page of the shop address as the shop app).
 * Hidden inside the installed app.
 */
export function InstallApp({ app, className = "", helpClassName = "" }: { app: "shop" | "admin"; className?: string; helpClassName?: string }) {
  const [evt, setEvt] = useState<InstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(true);
  const [help, setHelp] = useState<string | null>(null);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
    // Chrome's install offer is caught in <head> (InstallCapture) so it is never missed.
    const onPrompt = () => setEvt(capturedInstall());
    onPrompt();
    const onInstalled = () => {
      setEvt(null);
      setHelp("Installed — you’ll find it with your other apps.");
    };
    window.addEventListener("ka-installable", onPrompt);
    window.addEventListener("ka-installed", onInstalled);
    return () => {
      window.removeEventListener("ka-installable", onPrompt);
      window.removeEventListener("ka-installed", onInstalled);
    };
  }, []);

  if (standalone) return null;

  const explain = () => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const host = location.host;
    if (ios) return setHelp("In Safari, tap the Share button, then “Add to Home Screen”.");
    if (app === "admin" && !host.includes("admin")) {
      const adminHost = host.replace(/^([^.]+)/, "$1-admin");
      return setHelp(`Open ${adminHost} and tap Install there. If the shop app is installed, Chrome treats this address as part of the shop.`);
    }
    setHelp("It may already be installed — look for it with your apps. To reinstall, remove the old app first, then reload this page.");
  };

  const click = async () => {
    if (!evt) return explain();
    forgetInstall();
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    setEvt(null);
    if (outcome === "accepted") setHelp("Installed — you’ll find it with your other apps.");
  };

  return (
    <>
      <button type="button" onClick={click} className={className}>
        <Download aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
        {app === "admin" ? "Install admin app" : "Install our app"}
      </button>
      {help && (
        <p role="status" className={helpClassName}>
          {help}
        </p>
      )}
    </>
  );
}
