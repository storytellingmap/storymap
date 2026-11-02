---
last_mapped_commit: 29755b9a527ac50aa8e3f7ee73bc365a2e92da7d
last_mapped_at: 2026-11-02
---
<!-- refreshed: 2026-11-02 -->
# Testing Patterns

**Analysis Date:** 2026-11-02

## Test Framework

**Runner:**
- None. No test runner is installed or configured.
- `package.json` `scripts.test` is the npm placeholder: `echo "Error: no test specified" && exit 1`. `npm test` fails by design.
- No `jest.config.*`, `vitest.config.*`, `.mocharc*`, or equivalent file exists at the repo root.
- Dependencies (`package.json`): `three@^0.137.5`, `geolib@^3.3.3`. No dev dependencies are declared.

**Assertion Library:**
- None.

**Run Commands:**
```bash
npm test                       # Placeholder script, exits 1 with "no test specified"
npx prettier --check src index.js   # Only formatting check available; Prettier is not a declared dependency
```

## Test File Organization

**Location:**
- No test files exist. `git ls-files` lists 18 tracked files: `index.js`, `src/*.js` (five modules), `sample/*.geojson` and `sample/path.json` (fixtures), and Markdown docs.
- No `__tests__/`, `test/`, `tests/`, or `*.spec.*` / `*.test.*` files are present.

**Naming:**
- Not applicable. If tests are added, follow the module names: `src/city.test.js` for `src/city.js`.

**Structure:**
```
src/                   # Source modules; no tests
sample/                # Test-like data: bruges.geojson, small.geojson, path.json
```

## Test Fixtures and Sample Data

The `sample/` directory holds data a test can load without network access:

- `sample/small.geojson`: smallest dataset; use it for fast unit or integration checks.
- `sample/bruges.geojson`: full Bruges dataset used as the default `GLOBAL.config.data` in `src/globals.js`.
- `sample/path.json`: a recorded camera path (array of `[x, y, z]` triples) used as the default `GLOBAL.config.path`. The format matches the output of `savePath()` in `src/path.js`.

The default config paths point at `/node_modules/storymap/sample/...`. A test runner that serves the repo root must map those paths, or override `GLOBAL.config.data` and `GLOBAL.config.path` before calling any function.

## Test Structure

**Suite Organization:**
Not established. No pattern exists to copy.

**Recommended starting point (not in repo yet):**
```javascript
// src/city.test.js  (example only; requires adding a test runner)
import { describe, it, expect } from "vitest";
import { GLOBAL as $ } from "./globals";

describe("normalizeCoordinates", () => {
	it("maps the city centre to the origin", () => {
		// normalizeCoordinates is not exported; test through generateCity
		// or export it before testing.
	});
});
```

**Patterns:**
- Not applicable. Two blockers stop direct unit tests today:
  1. Most helpers are not exported. `normalizeCoordinates`, `generateShape`, `generateRoad`, `generateBuilding` in `src/city.js` are private. Only `generateCity` is exported from that module.
  2. Modules read the DOM and the browser at import and call time. `initialize()` in `src/initialize.js` calls `document.getElementById`, `new WebGLRenderer`, and `window.addEventListener`. `initializeEventListeners()` in `src/path.js` registers document listeners.

## Mocking

**Framework:** None installed.

**Patterns:**
- No mocks exist in the codebase.
- Likely needs, if tests are added:
  - `fetch`: `loadGeoJsonAsync()` in `src/city.js` and `loadPath()` in `src/animate.js` call `fetch($.config.data)` and `fetch($.config.path)`. Stub `fetch` to return `sample/small.geojson` or `sample/path.json` contents.
  - WebGL: `THREE.WebGLRenderer` needs a canvas context. Use a headless browser (Chrome DevTools or Playwright) rather than mocking the renderer, or stub the renderer object on `$.renderer`.
  - `document` and `window`: use jsdom or a browser environment. `src/initialize.js` reads `container.clientWidth`, which is an implicit global (see `CONVENTIONS.md`); a test must define `window.container` or a `#container` element.

**What to Mock:**
- Network `fetch` for GeoJSON and path JSON.
- The WebGL renderer, when a test checks scene contents only.
- `requestAnimationFrame` in `animate()` functions (`src/initialize.js`, `src/animate.js`). Each call re-schedules itself, so an unmocked call keeps the loop running.

**What NOT to Mock:**
- `three` geometry classes (`THREE.Shape`, `THREE.BufferGeometry`, `THREE.ExtrudeBufferGeometry`). They run in plain Node and produce the real vertex data a test should check.
- `geolib`. Its distance and bearing functions are pure and should run for real in `normalizeCoordinates`.

## Fixtures and Factories

**Test Data:**
- Use `sample/small.geojson` for generation tests. Each GeoJSON `feature` has `geometry` and `properties`. `create3dObjects` in `src/city.js` branches on `properties.building`, `properties.highway`, `properties.natural`, and `properties.leisure`.
- For a minimal inline fixture, follow this shape:
```javascript
const feature = {
	type: "Feature",
	properties: { building: "yes", "building:levels": 3 },
	geometry: {
		type: "Polygon",
		coordinates: [[[3.2271, 51.2096], [3.2275, 51.2096], [3.2275, 51.2099], [3.2271, 51.2096]]],
	},
};
```

**Location:**
- Put fixtures in `sample/`. No factory module exists.

## Coverage

**Requirements:** None enforced. No coverage tool is configured.

**View Coverage:**
```bash
Not available. Install a coverage tool first (for example `npm i -D vitest @vitest/coverage-v8`).
```

## Test Types

**Unit Tests:**
- Not used. Candidate targets: `normalizeCoordinates` and `create3dObjects` in `src/city.js`, `scalePercent` in `src/animate.js` (pure arithmetic), and `savePath` output format in `src/path.js`. Export these functions before testing them.

**Integration Tests:**
- Not used. Candidate: `generateCity` with `sample/small.geojson` in a headless browser, checking the mesh names `BUILDINGS`, `ROAD0...`, `WATER`, `GREEN` on `$.scene`.

**E2E Tests:**
- Not used. Manual verification in a browser is the current method. Check these items by hand:
  - Press `S` to download `path.json`.
  - Press `R` to reset the drawn line.
  - Press `Z` and `X` to undo and redo a point.
  - Scroll to run the camera animation from `src/animate.js`.

## Common Patterns

**Async Testing:**
- Not established. For the async loaders, `await generateCity(...)` and then check `$.buildingArray.length` or `$.scene.children`, once a `fetch` stub is in place.

**Error Testing:**
- Not established. `generateRoad` returns `undefined` for a single-point road (`src/city.js`). A test should assert that return value directly.

## Adding Tests (Guidance)

1. Add a runner as a dev dependency, for example `npm i -D vitest`. Use a browser environment (`jsdom` or Playwright) for code that touches `document` or `window`.
2. Replace the `scripts.test` placeholder in `package.json` with the runner command.
3. Place tests next to their module as `src/<name>.test.js`.
4. Export a helper only when a test needs it. Do not export internal helpers only to test them if an exported entry point covers the same behaviour.
5. Keep `.prettierrc` settings (tabs, double quotes, trailing commas) in test files.

---

*Testing analysis: 2026-11-02*
