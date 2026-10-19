/** Brand motifs drawn from the Kavita's Artistry logo: lotus + mirror-work ring. */

export function Lotus({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 64 56" className={className} fill={color} aria-hidden>
      <path d="M32 2c5 7 7 14 6 22-1 6-3 10-6 13-3-3-5-7-6-13-1-8 1-15 6-22z" />
      <path d="M13 12c8 2 14 7 17 14 2 4 2 8 2 11-4 0-9-1-13-5-5-5-7-12-6-20z" opacity=".92" />
      <path d="M51 12c1 8-1 15-6 20-4 4-9 5-13 5 0-3 0-7 2-11 3-7 9-12 17-14z" opacity=".92" />
      <path d="M2 26c8-1 15 1 21 6 3 3 6 6 7 9-5 1-11 0-16-3S4 31 2 26z" opacity=".8" />
      <path d="M62 26c-2 5-7 9-12 12s-11 4-16 3c1-3 4-6 7-9 6-5 13-7 21-6z" opacity=".8" />
      <circle cx="32" cy="46" r="2.6" />
      <path d="M32 50l2.6 2.6L32 55.2l-2.6-2.6z" />
    </svg>
  );
}

export function MirrorRing({ className = "", count = 16, color = "#f3ead8" }: { className?: string; count?: number; color?: string }) {
  const items = Array.from({ length: count });
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <defs>
        <linearGradient id="mr-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#d3dbe6" />
          <stop offset=".6" stopColor="#97a6b9" />
          <stop offset="1" stopColor="#eef2f7" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="196" fill="none" stroke={color} strokeWidth="5" />
      <circle cx="200" cy="200" r="132" fill="none" stroke={color} strokeWidth="5" />
      {items.map((_, i) => {
        const a = (i / count) * 360;
        const rad = (a * Math.PI) / 180;
        const x = (200 + Math.cos(rad) * 164).toFixed(2);
        const y = (200 + Math.sin(rad) * 164).toFixed(2);
        const a2 = ((i + 0.5) / count) * Math.PI * 2;
        return (
          <g key={i}>
            <g transform={`translate(${x},${y}) rotate(${a + 90})`}>
              <path d="M0,-24 C17,-8 17,10 0,18 C-17,10 -17,-8 0,-24Z" fill="none" stroke={color} strokeWidth="5" />
              <path d="M0,-17 C11,-6 11,7 0,12 C-11,7 -11,-6 0,-17Z" fill="url(#mr-g)" />
            </g>
            <circle cx={(200 + Math.cos(a2) * 150).toFixed(2)} cy={(200 + Math.sin(a2) * 150).toFixed(2)} r="5" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

export function DotDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-12 bg-current opacity-30" />
      <span className="size-1.5 rotate-45 bg-current opacity-60" />
      <span className="size-2 rotate-45 bg-current" />
      <span className="size-1.5 rotate-45 bg-current opacity-60" />
      <span className="h-px w-12 bg-current opacity-30" />
    </div>
  );
}

export function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.56.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.45 9.43m8.04-17.47A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.07c0 2 .52 3.96 1.52 5.68L.58 23.7l6.09-1.6a11.33 11.33 0 0 0 5.38 1.37h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.9-3.33-8.04" />
    </svg>
  );
}

export function InstagramIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z" />
    </svg>
  );
}

export function YoutubeIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  );
}
