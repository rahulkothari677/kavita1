# UI/UX upgrade — progress (started 21 Oct 2026)

Owner approved all six phases. Nothing is pushed (= live) until the owner says "push".
Reference: owner's logo image (navy + cream mirror-work medallion) and a 10 s logo-reveal video:
particles burst, a light streak sweeps the ring, the ring redraws, the cream centre fills,
the name appears, then the four craft icons + "Art that adds happiness to your space".
The splash is rebuilt in code (not the video file): ~2 s, sharp at any size, no cropping.

| Phase | What | Status |
|---|---|---|
| 1 | Speed: prerendered shop pages, resized photos | done, commit cb7232f (local) |
| 2 | Perfect vector logo + app icons | done |
| 3 | Splash animation + motion across the app | done |
| 4 | Bottom tab bar, AI button placement, footer | done |
| 5 | Themes that differ in fonts/shapes/backgrounds, richer section backgrounds | next |
| 6 | Written "best artwork app" improvement plan | |

## Notes
- /shop and /gift-finder stay server-rendered (they read the address bar's filters); they skip the
  database via lib/cached.ts. The rest of the remaining wait is the USA server (see HANDOFF "Move to Mumbai").
- Local test server: port 3000/3010 are used by other apps on this laptop; the Browser pane preview
  is "kavita-shop" (C:\Users\rahul4\.claude\launch.json).
