/**
 * Chrome announces "this site can be installed" (beforeinstallprompt) once per page load, often
 * before React has started. This inline <head> script catches it straight away and keeps it on
 * window.__kaInstall, so the install pop-up and the footer's Install button can use it whenever they
 * mount. Chrome only sends it while the app is NOT installed, which makes it the reliable signal.
 */
const SCRIPT = `(function(){try{
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__kaInstall=e;window.dispatchEvent(new Event('ka-installable'))});
window.addEventListener('appinstalled',function(){window.__kaInstall=null;window.dispatchEvent(new Event('ka-installed'))});
}catch(e){}})();`;

export function InstallCapture() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}

export type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** The captured install offer, if Chrome made one on this page load (client only). */
export function capturedInstall(): InstallPromptEvent | null {
  return (window as unknown as { __kaInstall?: InstallPromptEvent | null }).__kaInstall ?? null;
}

/** An offer can be shown only once per page load: forget it before showing it. */
export function forgetInstall() {
  (window as unknown as { __kaInstall?: InstallPromptEvent | null }).__kaInstall = null;
}
