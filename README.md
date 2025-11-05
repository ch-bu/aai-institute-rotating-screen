# aai-institute-rotating-screen

## Usage

Open `index.html` in a browser (kiosk mode recommended). Images listed in
`images/manifest.json` rotate every 30 seconds, with `images/program.png`
displayed between each slide.

To add or remove slides, update `images/manifest.json` with the filenames you
want to include. Keep `program.png` out of the manifest—it's automatically
inserted between the other images. Ensure any new images live in the `images/`
folder alongside the manifest.
