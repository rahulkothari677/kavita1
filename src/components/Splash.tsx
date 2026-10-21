/**
 * Opening animation, after the owner's logo-reveal video: sparkles gather into the ring, a streak
 * of light sweeps round it, the mirrors set one by one, the cream centre fills, the lotus blooms
 * and the name is written in. About 2 seconds; a tap skips it.
 *
 * Shown on every launch of the installed app, and only on the very first visit in a browser.
 * Pure server markup + CSS (globals.css "Splash"), hidden by default; a tiny inline script
 * switches it on before the first paint when it should play.
 */

import { preload } from "react-dom";

const PETAL = "M0,-36 C10,-26 19,-10 18,5 C17,19 8,24 0,24 C-8,24 -17,19 -18,5 C-19,-10 -10,-26 0,-36 Z";
const GAP = "M0,30 C9,18 15,4 13,-8 C11,-20 4,-26 0,-30 C-4,-26 -11,-20 -13,-8 C-15,4 -9,18 0,30 Z";
const N = 16;
const R_OUT = 252;
const R_IN = 170;
const RIM = "#e6d7bf";

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Sparkles start scattered and fly onto the ring; positions are fixed so the markup is static. */
const SPARKS = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2 + 0.35;
  const far = 330 + ((i * 37) % 90);
  return { x: r2(Math.cos(a) * far), y: r2(Math.sin(a) * far), size: 2 + (i % 3), d: (i % 6) * 40 };
});

// Runs as soon as the splash markup is parsed. It only flips <html data-splash>; it never removes
// nodes, so React's hydration still finds exactly the markup the server sent.
const GATE = `try{var h=document.documentElement,app=matchMedia('(display-mode: standalone)').matches||navigator.standalone,k=app?sessionStorage:localStorage;
if(!k.getItem('ka_splash')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){k.setItem('ka_splash','1');h.dataset.splash='play';
document.addEventListener('click',function(e){var s=e.target.closest&&e.target.closest('#ka-splash');if(s)s.classList.add('splash-skip')});
setTimeout(function(){h.dataset.splash='done'},2600)}}catch(e){}`;

export function Splash() {
  preload("/brand/logo-text.svg", { as: "image", fetchPriority: "high" });
  return (
    <>
      <div id="ka-splash" className="splash" aria-hidden>
        <div className="splash-stage">
          <svg viewBox="-256 -256 512 512" className="splash-svg">
            <defs>
              <radialGradient id="sp-band" cx="50%" cy="45%" r="55%">
                <stop offset="0" stopColor="#1b2b52" />
                <stop offset="1" stopColor="#14213f" />
              </radialGradient>
              <linearGradient id="sp-mirror" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset=".45" stopColor="#d9e1ea" />
                <stop offset=".7" stopColor="#aeb9c6" />
                <stop offset="1" stopColor="#e9eef3" />
              </linearGradient>
              <radialGradient id="sp-centre" cx="45%" cy="38%" r="70%">
                <stop offset="0" stopColor="#f7efe2" />
                <stop offset="1" stopColor="#f1e7d6" />
              </radialGradient>
              <linearGradient id="sp-streak" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#fff" stopOpacity="1" />
              </linearGradient>
              <path id="sp-petal" d={PETAL} />
              <path id="sp-gap" d={GAP} />
            </defs>

            {SPARKS.map((p, i) => (
              <circle
                key={i}
                className="sp-spark"
                r={p.size}
                fill="#f6eedf"
                style={{ "--x": `${p.x}px`, "--y": `${p.y}px`, animationDelay: `${p.d}ms` } as React.CSSProperties}
              />
            ))}

            <g className="sp-band">
              <circle r={R_OUT} fill="url(#sp-band)" />
            </g>
            <circle className="sp-rim" r={R_OUT - 3.5} fill="none" stroke={RIM} strokeWidth="7" pathLength={100} />

            {Array.from({ length: N }, (_, i) => {
              const a = (i * 360) / N;
              const g = ((i + 0.5) * 360) / N;
              const rad = ((g - 90) * Math.PI) / 180;
              const ro = R_OUT - 18;
              const st = { "--i": i } as React.CSSProperties;
              return (
                <g key={i}>
                  <g transform={`rotate(${a}) translate(0 -207)`}>
                    <use href="#sp-petal" className="sp-petal" style={st} fill="url(#sp-mirror)" stroke={RIM} strokeWidth="5" strokeLinejoin="round" />
                  </g>
                  <g transform={`rotate(${g}) translate(0 ${-(R_IN + (R_OUT - R_IN) * 0.36)}) scale(0.8)`}>
                    <use href="#sp-gap" className="sp-gap" style={st} fill="none" stroke={RIM} strokeWidth="4" strokeLinejoin="round" />
                  </g>
                  <circle className="sp-dot" style={st} cx={r2(ro * Math.cos(rad))} cy={r2(ro * Math.sin(rad))} r="7" fill={RIM} />
                </g>
              );
            })}

            <circle className="sp-centre" r={R_IN} fill="url(#sp-centre)" stroke={RIM} strokeWidth="7" />

            {/* The light streak that sweeps round the ring */}
            <g className="sp-streak">
              <circle r={R_OUT - 22} fill="none" stroke="url(#sp-streak)" strokeWidth="5" strokeLinecap="round" pathLength={100} strokeDasharray="22 78" />
            </g>

            <g transform="translate(0 -56) scale(1.2)">
              <g className="sp-lotus" fill="#1d2b52">
              {[
                [0, 30, 9],
                [-30, 26, 8],
                [30, 26, 8],
                [-62, 21, 7],
                [62, 21, 7],
              ].map(([rot, len, wid]) => (
                <path
                  key={rot}
                  transform={`rotate(${rot})`}
                  d={`M0,0 C${wid},-${len * 0.35} ${wid * 0.7},-${len * 0.8} 0,-${len} C-${wid * 0.7},-${len * 0.8} -${wid},-${len * 0.35} 0,0 Z`}
                />
              ))}
              </g>
            </g>

            <image className="sp-words" href="/brand/logo-text.svg" x="-256" y="-256" width="512" height="512" />

            <g transform="translate(0 100) scale(0.9)">
              <g className="sp-flower" fill="#1d2b52">
              {[0, 90, 180, 270].map((r) => (
                <path key={r} transform={`rotate(${r})`} d="M0,0 C3,-3 3,-7 0,-10 C-3,-7 -3,-3 0,0 Z" />
              ))}
              </g>
            </g>
          </svg>
          <p className="splash-tag">Art that adds happiness to your space</p>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: GATE }} />
    </>
  );
}
