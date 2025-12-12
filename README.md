# AAI Institute Rotating Screen

Vite-powered static signage site that will later be hydrated with content from a Notion page.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

The build artifacts land in `dist/`, which the deployment workflow uploads to GitHub Pages. All layout constraints (portrait 16:9 surface, background `#E9EEF1`, and hidden scrollbars) are implemented in `src/style.css`.
