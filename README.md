# aai-institute-rotating-screen

## Quick start

1. Place your slide assets (PNG, JPG, GIF, WebP, BMP, or SVG) inside the
   `images/` directory next to `program.png`.
2. Serve the folder with any static web server. For local testing:
   ```sh
   python -m http.server 8000
   ```
3. Open `http://localhost:8000/index.html` (kiosk or fullscreen mode
   recommended).

The page auto-discovers every image in `images/` (except `program.png`) and
cycles through them for 30 s each, inserting `program.png` between every slide.
Scrolling is disabled and each slide is stretched to the full viewport.

## Adding or removing slides

- Drop a new file in `images/` and it will appear in the rotation immediately
  on the next load—no config edits required.
- Delete a file from `images/` to remove it from the sequence.
- Keep the filename `program.png` reserved for the interstitial slide; it is
  always injected automatically and should not be duplicated.

## When directory listings are disabled

Some hosting environments block directory browsing, which prevents the page
from auto-discovering the files. In that case, add a small inline script (or
create `images/manifest.js` and include it) that defines a manifest fallback:

```html
<script>
  window.__ROTATING_SCREEN_MANIFEST__ = {
    images: ["screen1.png", "screen2.png"]
  };
</script>
```

Only list the non-program slides. The page sanitizes names (case-insensitive),
so you can include or omit the `images/` prefix. Once directory listings are
enabled again, you can remove the manifest script.
