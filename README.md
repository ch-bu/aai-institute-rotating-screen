# aai-institute-rotating-screen

## Quick start

1. Add your slide assets (PNG, JPG, GIF, WebP, BMP, or SVG) to the `images/`
   directory. Keep `program.png` untouched; it is inserted between every slide.
2. Regenerate the slide manifest:
   ```sh
   npm run build
   ```
   (Netlify executes the same command automatically thanks to `netlify.toml`.)
3. Serve the folder with any static web server and open `index.html` in kiosk /
   fullscreen mode. For local testing:
   ```sh
   python -m http.server 8000
   ```

Slides display for 30 s each, always alternating with `program.png`. The page
is locked to the viewport and scrolling is disabled, making it ready for
vertical signage screens.

## How the manifest works

- `npm run build` runs `scripts/generate-manifest.js`, which scans `images/`,
  filters out `program.png`, sorts filenames naturally, and writes
  `images/manifest.json`.
- `index.html` fetches `images/manifest.json` at runtime. If it is missing or
  empty, the page logs the error and falls back to showing only `program.png`.

Because the manifest is generated automatically, you never have to hand-edit it.
Commit the updated `images/manifest.json` if you want teammates to see the same
rotation locally; Netlify will rebuild it on deploy regardless.

## Optional manual override

If you need a custom order or want to specify a subset of slides without
regenerating the manifest, include an inline script (or `images/manifest.js`)
that sets `window.__ROTATING_SCREEN_MANIFEST__ = { images: [...] };`. The
runtime will prefer the generated JSON, but will fall back to this list if the
JSON fetch fails. Only list non-program slides; the app still injects
`program.png` automatically.
