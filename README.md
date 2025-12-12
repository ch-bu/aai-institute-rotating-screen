# AAI Institute Rotating Screen

Vite-powered static signage site hydrated at build-time with content from a Notion database.

## Development

```bash
npm install
# supply credentials via exported env vars or a local .env file
# NOTION_TOKEN=secret
# NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxx
# Optional column overrides:
# NOTION_TITLE_PROPERTY=Title
# NOTION_DATE_PROPERTY="Date of delivery"
# NOTION_TIME_PROPERTY=Time
# NOTION_LANGUAGE_PROPERTY=Language
# NOTION_PRICE_PROPERTY=Price
npm run dev
```

## Production build

```bash
# Fetches events automatically before building
npm run build
npm run preview
```

`npm run dev` and `npm run build` call `npm run fetch:events`, which hits the Notion API (using `NOTION_TOKEN` and `NOTION_DATABASE_ID` sourced from your environment or `.env` file) and stores the latest five upcoming records in `public/events.json`. The frontend fetches that file at runtime so re-running `npm run fetch:events` updates the page without rebuilding. The build artifacts land in `dist/`, which the deployment workflow uploads to GitHub Pages. All layout constraints (portrait 16:9 surface, background `#E9EEF1`, and hidden scrollbars) are implemented in `src/style.css`.
