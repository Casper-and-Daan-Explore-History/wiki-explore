# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WikiExplore is a static website (wikiexplore.org) that lets users discover Wikipedia articles on an interactive map. Users can search locations, click random cities, and browse geotagged Wikipedia content with rich info panels pulling data from Wikipedia, Wikidata, and Wikimedia Commons.

## Tech Stack

- **No build system** — vanilla JS, plain CSS, static HTML served directly via GitHub Pages
- **No package.json or node_modules** — all dependencies loaded via CDN
- Mapbox GL JS v1.7.0 (map rendering, geocoder search, clustering)
- jQuery 3.3.1 (DOM manipulation, animations)
- Tachyons 4.12.0 (utility CSS classes)
- Font Awesome (icons), Fontshare Supreme (typography)

## Linting

ESLint config (`.eslintrc.json`): 4-space indentation, single quotes, semicolons required, no trailing commas.

## Architecture

The app has no modules or bundling — scripts are loaded sequentially in `index.html`:

1. **`data.js`** — exports a global `cities` array of `{n, c, q}` objects (name, coordinates, Q-number) used for random start locations
2. **`index.js`** — core application logic (~770 lines), contains:
   - Map initialization and Mapbox source/layer setup (`wikipediaSource` with GeoJSON clustering)
   - `fetchArticlesInBoundingBox()` — called on load and every `moveend` event; queries the **Wikipedia Geosearch API** for articles in the current map viewport
   - `processArticles()` / `addArticlesToGoejson()` — deduplicates and accumulates articles into a global `articlesGeojson` FeatureCollection
   - `openInfoPanel()` → `wikipediaApiRequestDetails()` → `WikidataApiRequestDetails()` — three-stage data fetching chain: map click → Wikipedia extracts API → Wikidata SPARQL endpoint
   - `WikidataApiResultsProcessingDetails()` — processes raw SPARQL results, enriches values (builds URLs for social media, formats measurements), stores everything on the global `infoPanel` object
   - `updateInfoPanel()` — renders all fetched data into the sidebar DOM
   - Context menu (right-click) with links to Google Maps, Apple Maps, Bing, OpenStreetMap, etc.
3. **`buttons.js`** — info panel show/hide with responsive breakpoints (sidebar at >900px, fullscreen at <900px)
4. **`image.js`** — toggles article image between inline and fullscreen overlay

### Key globals

- `articlesGeojson` — accumulates all discovered Wikipedia articles as GeoJSON features (never cleared)
- `infoPanel` — current article's combined Wikipedia + Wikidata data; reset on each new article click
- `map` — the Mapbox GL map instance

### API flow

```
Map pan/zoom → Wikipedia Geosearch API (bounding box, limit 500)
                → GeoJSON points on map with clustering

Article click → Wikipedia API (extracts, pageprops, pageimages)
                → Wikidata SPARQL POST (extensive property query by Q-number)
                  → Sidebar rendered with combined data
```

## Other Files

- `query_optimalisation.js` — development log of SPARQL query benchmarks (not loaded in production)
- `style.json` — Mapbox map style definition
- `data/cities/` — source CSV and Python scripts used to generate `data.js`
- `about.html` — standalone about page
- `index_backup.js`, `index_backup_14-march-2023.js` — historical backups of index.js
