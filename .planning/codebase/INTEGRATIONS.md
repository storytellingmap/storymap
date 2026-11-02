---
last_mapped_commit: 29755b9a527ac50aa8e3f7ee73bc365a2e92da7d
last_mapped_at: 2026-11-02
---
# External Integrations

**Analysis Date:** 2026-11-02

## APIs & External Services

**Runtime external services:**
- None. The code makes no HTTP calls to third-party APIs. The only `fetch` calls load local files from the consuming site's origin:
  - `src/city.js` `loadGeoJsonAsync()` - fetches `$.config.data` (GeoJSON)
  - `src/animate.js` `loadPath()` - fetches `$.config.path` (JSON array of `[x, y, z]` points)

**Map data source (manual, build-time, not called by code):**
- OpenStreetMap - source of building, road, water and green-space geometry. Referenced in `README.md`, `SOURCES.md`, `sample/*.geojson` (copyright header: ODbL).
  - Auth: none
- overpass-turbo (`https://overpass-turbo.eu`) - user exports GeoJSON with the query in `README.md` § Getting GeoJSON data. The package does not call the Overpass API.
  - SDK/Client: none
  - Auth: none

**Reference links (documentation only, not called at runtime):**
- `SOURCES.md` lists three.js docs and examples, 3dbuildings.com, Mapbox and Cesium docs, and Google design material.

## Data Storage

**Databases:**
- None.

**File Storage:**
- Local files only. Input data is served as static files from the consuming site:
  - `sample/bruges.geojson` (~1.3 MB, default dataset)
  - `sample/small.geojson` (~168 KB)
  - `sample/path.json` (saved camera path, default)
- Path saving is client-side. `savePath()` in `src/path.js` builds JSON in memory and triggers a browser download of `path.json` through a `Blob` and an object URL. Nothing is uploaded.

**Caching:**
- None. No service worker, HTTP cache headers or local storage use.

## Authentication & Identity

**Auth Provider:**
- Not applicable. The package has no user accounts, sessions or tokens.

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, GlitchTip or similar SDK is present.

**Logs:**
- Console logging is commented out in the source (for example `console.log` in `src/city.js` and `src/animate.js`). No active logging framework.

**Performance display:**
- `three/examples/jsm/libs/stats.module` FPS counter, only when `config.debug` is `true` (`src/initialize.js`). It is rendered into the container and does not send data anywhere.

## CI/CD & Deployment

**Hosting:**
- Not configured in this repository. The package is installed from GitHub (`npm install https://github.com/elfensky/storymap`). The consuming site is deployed separately.

**CI Pipeline:**
- None detected. No `.github/workflows`, `.gitlab-ci.yml` or similar file exists.

## Environment Configuration

**Required env vars:**
- None. The code reads no environment variables.

**Required runtime configuration:**
- `GLOBAL.config.data`, `GLOBAL.config.path`, `GLOBAL.config.container` and `GLOBAL.config.citycenter` must match the consuming page (see `STACK.md` § Configuration).
- A DOM element with the id given in `config.container` must exist before `setup()` or `start()` runs. `INSTALLATION.md` shows the required markup, including `#container` and `#shortcuts`.

**Secrets location:**
- No secrets are used. No `.env` file, credentials file or API key is present in the repository.

## Webhooks & Callbacks

**Incoming:**
- None. The package exposes no HTTP endpoints.

**Outgoing:**
- None. No network requests are made besides the same-origin static file fetches listed above.

## Browser Input and Output Integrations

These are browser-side integrations and do not leave the client:
- DOM events on `document`: `mousedown`, `mousemove`, `click`, `keyup` (keys `s`, `r`, `z`, `x`), and `scroll`. Handled in `src/path.js` and `src/animate.js`.
- Window event: `resize` (`src/initialize.js`).
- Keyboard `s` triggers a JSON file download of the drawn path (`src/path.js` `savePath()`).
- WebGL context created by `THREE.WebGLRenderer` in `src/initialize.js`.

---

*Integration audit: 2026-11-02*
