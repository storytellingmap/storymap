---
last_mapped_commit: 29755b9a527ac50aa8e3f7ee73bc365a2e92da7d
last_mapped_at: 2026-11-02
---
# Technology Stack

**Analysis Date:** 2026-11-02

## Languages

**Primary:**
- JavaScript (ES modules, `import`/`export`, `async`/`await`) - all runtime code in `index.js` and `src/*.js`

**Secondary:**
- Markdown - documentation in `README.md`, `INSTALLATION.md`, `DOCS.md`, `SOURCES.md`, `ANSWERS.md`
- GeoJSON (OpenStreetMap export, produced by overpass-turbo) - map input data in `sample/bruges.geojson` and `sample/small.geojson`
- JSON - saved camera/line path data in `sample/path.json`, and `package.json`

## Runtime

**Environment:**
- Browser only. The code calls `document`, `window`, `fetch`, `Blob`, `URL.createObjectURL` and WebGL through three.js. It has no Node.js entry point.
- No `.nvmrc`, `.node-version` or `engines` field is present. Node is needed only for the npm install and the Vite dev server described in `INSTALLATION.md`.
- Module type: `package.json` has no `"type": "module"` field. The files use ESM syntax and rely on the consuming bundler (Vite) to resolve them.

**Package Manager:**
- npm (per `INSTALLATION.md`: `npm install https://github.com/elfensky/storymap`)
- Lockfile: missing from the repository. `package-lock.json` is listed in `.gitignore` (added in commit `62fc1b6`), so installed dependency versions are not pinned.

## Frameworks

**Core:**
- three.js `^0.137.5` - 3D scene, camera, renderer, meshes, lines, raycasting. Used in `src/initialize.js`, `src/city.js`, `src/path.js`, `src/animate.js`, `src/globals.js`.
- three.js example modules (imported from the same package):
  - `three/examples/jsm/controls/OrbitControls` (`MapControls`) - `src/initialize.js`
  - `three/examples/jsm/libs/stats.module` (FPS counter) - `src/initialize.js`
  - `three/examples/jsm/utils/BufferGeometryUtils` (`mergeBufferGeometries`) - `src/city.js`

**Testing:**
- Not detected. `package.json` `scripts.test` is a placeholder that exits with an error. No test files exist.

**Build/Dev:**
- Vite - not a dependency of this package. `INSTALLATION.md` tells consuming projects to scaffold with `npm init vite@latest` and run `npm run dev`. The package itself has no build step.
- Prettier - configured in `.prettierrc` (4-space tab width, `useTabs: true`, `trailingComma: "all"`, `bracketSameLine: true`, `jsxSingleQuote: true`, `semi: true`). Prettier is not listed in `package.json`.
- Git attributes - `.gitattributes` sets `* text=auto` (LF normalization).

## Key Dependencies

**Critical:**
- `three` `^0.137.5` (`package.json` `dependencies`) - the whole rendering layer. Version 0.137 is old. Some APIs used here are deprecated or removed in newer three.js releases:
  - `THREE.ExtrudeBufferGeometry` in `src/city.js` (`generateGeometry`). The `BufferGeometry` suffix was removed in later releases.
  - `three/examples/jsm/libs/stats.module` in `src/initialize.js`. Its location changed in later releases.
- `geolib` `^3.3.3` (`package.json` `dependencies`) - geodesic calculations. `GEOLIB.getDistance` and `GEOLIB.getRhumbLineBearing` are used in `normalizeCoordinates` in `src/city.js` to convert lon/lat pairs into local x/z plane coordinates around `config.citycenter`. `src/path.js` imports `geolib` but does not call it.
- `three/examples/jsm/lines/LineMaterial` is imported in `src/globals.js` but not used.

**Infrastructure:**
- None beyond the two runtime dependencies above.

**Dev/Metadata:**
- `package.json` `name`: `storymap`, `version`: `1.0.0`, `main`: `index.js`, `license`: `UNLICENSED`.
- Repository: `git+https://github.com/elfensky/storymap.git`.

## Configuration

**Environment:**
- No environment variables are read. No `process.env` usage exists in the source.
- Runtime configuration is a plain JavaScript object, `GLOBAL.config`, defined in `src/globals.js`. Consumers override it in their own `main.js` before calling `setup()` or `start()` (`README.md` § Configuration). Keys:
  - `debug` - enables the FPS counter, `MapControls` and axes helper (`src/initialize.js`)
  - `data` - URL of the GeoJSON file (default `/node_modules/storymap/sample/bruges.geojson`)
  - `path` - URL of the saved path JSON (default `/node_modules/storymap/sample/path.json`)
  - `container` - DOM id of the element that holds the canvas (default `"container"`)
  - `citycenter` - `[longitude, latitude]` of the map center (default `[3.227183, 51.209651]`, Bruges)
  - `color_background`, `color_buildings`, `color_ground`, `opacity_ground`, `grid` - colors and opacity values
- `.env` files: none present.

**Build:**
- No build configuration in this repository. `.gitignore` excludes `node_modules`, `dist`, `dist-ssr`, `*.local`, `.DS_Store`, `package-lock.json`.
- `.prettierrc` - formatting rules (see Frameworks).
- `.gitattributes` - line-ending normalization.

## Platform Requirements

**Development:**
- Node.js and npm (version not pinned in the repository)
- A browser with WebGL support
- A local static file server or Vite dev server. The GeoJSON and path files are loaded with `fetch` from URLs, so they cannot be opened as `file://` URLs.

**Production:**
- Static hosting for the consuming site. The package has no server-side code. Data files are served from the same origin as the page, as `/node_modules/storymap/sample/...` by default.
- Published as an npm package installed from GitHub (`https://github.com/elfensky/storymap`). It is not published to the npm registry.

---

*Stack analysis: 2026-11-02*
