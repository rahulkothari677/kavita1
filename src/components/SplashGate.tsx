/**
 * Start-up control for the opening animation (components/Splash.tsx), placed in <head> so it runs
 * before anything is painted. Decides whether the splash plays, hides the page while it does, and
 * ends it only when the page has finished loading (never before a minimum, never after a cap).
 *
 * - Installed app: plays on every launch. Android and Chrome have just shown their own launch
 *   screens (navy, from the manifest's background_color) with the full logo, so the splash starts as
 *   that same logo at the same size and place, bursts it apart and rebuilds it (html[data-splash-app]).
 * - Browser: only on the very first visit. Never for reduced-motion users.
 * States on <html data-splash>: play → out (0.4 s fade) → done. Nothing is removed from the DOM,
 * so hydration always finds the server's markup.
 */
const SCRIPT = `(function(){try{
var h=document.documentElement,p=location.pathname;
if(p.indexOf('/admin/invoice')===0||p.indexOf('/admin/login')===0)return;
var app=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,k=app?sessionStorage:localStorage;
if(k.getItem('ka_splash')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
k.setItem('ka_splash','1');h.setAttribute('data-splash','play');if(app)h.setAttribute('data-splash-app','');
var t0=Date.now(),min=app?2500:2200,ended=false;
function end(){if(ended)return;ended=true;h.setAttribute('data-splash','out');setTimeout(function(){h.setAttribute('data-splash','done')},420)}
function ready(){setTimeout(end,Math.max(0,min-(Date.now()-t0)))}
if(document.readyState==='complete')ready();else addEventListener('load',ready);
setTimeout(end,4500);
document.addEventListener('DOMContentLoaded',function(){if(!document.getElementById('ka-splash'))end()});
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#ka-splash'))end()});
}catch(e){}})();`;

/** Inline so the splash is navy and the page hidden from the very first paint (no stylesheet wait). */
const CRITICAL_CSS = `html[data-splash=play],html[data-splash=out]{background:#14213f}
html[data-splash=play] body{visibility:hidden;overflow:hidden}
html[data-splash=play] #ka-splash,html[data-splash=out] #ka-splash{visibility:visible;display:grid;place-items:center;position:fixed;inset:0;z-index:200;cursor:pointer;background:radial-gradient(120% 90% at 50% 40%,#22355f 0%,#14213f 55%,#0d1730 100%)}
html[data-splash=out] #ka-splash{opacity:0;transform:scale(1.03);transition:opacity .4s ease-in,transform .4s ease-in;pointer-events:none}`;

export function SplashGate() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </>
  );
}
