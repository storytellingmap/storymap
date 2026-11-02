# Stack Research

**Domain:** Browser 3D story-map library (three.js city from OpenStreetMap GeoJSON, drawn path, scroll-driven camera),
plain-JavaScript ES modules consumed through Vite
**Researched:** 2026-11-02
**Confidence:** HIGH for versions and API changes (npm registry, package tarballs and a local run); MEDIUM for Linux CI
WebGL behaviour (verified on macOS only)

## Verdict

Move to `three` 0.187.0 and `geolib` 4.0.1 in one dependency change. Test with Vitest 5 browser mode, the Playwright
provider and headless Chromium. Pin the dev toolchain to Node 26 (Active LTS since 2026-10-28). Add no build step,
no TypeScript and no second test runner.

**eli14:** The library is a model city. The old city used bricks from 2022 (three.js r137). The brick maker changed the
names of three bricks and moved one to a different box. The new bricks fit once the names are corrected. For testing,
a robot browser opens the city with no screen and no graphics card. It draws with a software "pencil" (SwiftShader).
It is slow, but it draws real pixels. So a test can check that the city is not empty or broken. Today the risk is small
and local: three renamed bricks. In the future, a wrong test setup can pass on a laptop and fail in CI. The explicit
software-pencil flag prevents that.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| `three` | `^0.187.0` (r187, released 2026-10-30) | Scene, geometry, renderer, controls | Current release. For a 0.x package `^0.187.0` means `>=0.187.0 <0.188.0`, so npm cannot pull in a breaking release. three.js publishes breaking changes in every minor release. | HIGH (npm registry, tarball) |
| `geolib` | `^4.0.1` (4.0.0 on 2026-10-08, 4.0.1 on 2026-10-30) | Lon/lat to local metres (`getDistance`, `getRhumbLineBearing`) | The existing `import * as GEOLIB from "geolib"` already works with v4. v4 ships real ESM through `exports`, so Vite needs no CommonJS pre-bundle. | HIGH (tarball, local run) |
| Node.js | 26.x LTS "Lithium" (26.13.0 is the latest LTS) | Dev toolchain and CI only | Active LTS since 2026-10-28, maintenance from 2027-10-20, EOL 2029-04-30. Vitest 5 accepts `^22.12 \|\| ^24 \|\| >=26`; Vite 8 accepts `^20.19 \|\| >=22.12`. | HIGH (Node release schedule) |

### Supporting Libraries (dev only)

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| `vitest` | `^5.0.5` | Test runner | The single test runner. It runs the library source through Vite, the same resolver the consumers use. | HIGH (local run) |
| `@vitest/browser-playwright` | `^5.0.5` (must equal the `vitest` version; peer `vitest: 5.0.5`) | Browser-mode provider | Runs the tests in a real Chromium with WebGL, `fetch`, DOM and canvas. It replaces the old `@vitest/browser` + `provider: 'playwright'` string config. | HIGH (local run) |
| `playwright` | `^1.64.1` | Browser binaries for the provider | Required peer of `@vitest/browser-playwright`. It ships Chromium 156 (`chromium-headless-shell` revision 1248). | HIGH (local run) |
| `vite` | `^8.3.5` | Dev server for the health-check consumer; the transform layer under Vitest | Vitest 5 accepts Vite `^6.4 \|\| ^7 \|\| ^8`. Install it explicitly so the version is pinned. | HIGH (npm registry) |
| `prettier` | `^3.9.10` | Formatter | Optional. `.prettierrc` exists but Prettier is not a dependency. Add it only with a `format` script. | HIGH (npm registry) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `.node-version` with `26` | One Node line for mise, nvm-compatible tools and CI | Do not add an `engines` field in v1.1. The package is not published; `engines` belongs to the v2.1 npm work. |
| `package-lock.json`, committed | Reproducible dev installs and CI | Remove it from `.gitignore`. A lockfile in a library repo does not affect consumers. It only pins the toolchain. Without it, `^3.3.3` already resolves to `geolib` 3.3.14, not the 2022 version. |
| GitHub Actions: `actions/checkout@v7`, `actions/setup-node@v7` | CI | `setup-node` with `node-version-file: .node-version` and `cache: npm`. Install the browser with `npx playwright install --with-deps chromium`. |
| `vitest.config.js` | Browser-mode config | Name it `vitest.config.mjs`, or add `"type": "module"` to `package.json`. Vite 8 warns about ESM syntax in a CommonJS-scoped `.js` config. |

## Migration: three.js r137 to r187

Only these changes touch the current code. The source is the official migration guide, checked against the r187
tarball.

| Change (release) | Where in this repo | Required edit | Failure mode if missed |
|------------------|--------------------|---------------|------------------------|
| `ExtrudeBufferGeometry` alias removed (deprecated r145) | `src/city.js` `generateGeometry` | `new THREE.ExtrudeGeometry(...)` | `import * as THREE` hides the error at build time. At run time: `TypeError: THREE.ExtrudeBufferGeometry is not a constructor`. |
| `mergeBufferGeometries()` renamed to `mergeGeometries()` (r151) | `src/city.js` (3 calls) | `import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"` | Named-import error at module load: the whole library fails to start. |
| `MapControls` moved to its own file (r151) | `src/initialize.js` | `import { MapControls } from "three/addons/controls/MapControls.js"` | Verified: `does not provide an export named 'MapControls'` at module load. This breaks `setup()` and `start()`, not only debug mode. |
| `ColorManagement.enabled = true`, `outputColorSpace = SRGBColorSpace` (r152) | `src/globals.js`, `src/initialize.js` colours | None for correctness. Colours from hex values are converted, so the result looks a little different. | Visual only. Compare against 2022 screenshots; adjust `config.color_*` only if Andrei wants the old look. |
| Point-light `decay` default 2 (r147); physically-correct lights by default (r155), legacy mode removed later | `src/initialize.js` `light1` (`PointLight`, intensity 0.5, at 500/1000/500) | Use a `DirectionalLight` for sun-like light, or set `decay: 0` and raise the intensity. | The point light is about 1 200 units from the city. With inverse-square decay its contribution is near zero. Buildings show ambient light only: flat and dark. |
| WebGL 1 removed (r163) | `WebGLRenderer` | None. All current browsers and headless Chromium give WebGL 2. | — |

No change needed: `three/examples/jsm/libs/stats.module.js` (still in the same place, default export),
`three/examples/jsm/lines/LineMaterial.js` (still present; the import in `src/globals.js` is unused and can go),
`BufferGeometry.setDrawRange`, `Raycaster`, `LineBasicMaterial`, `MeshPhongMaterial`, `Shape`.

### Addon import paths: use `three/addons/...` with the `.js` extension

The r187 `package.json` exports map has both `"./addons/*": "./examples/jsm/*"` and `"./examples/jsm/*":
"./examples/jsm/*"`. Both point at the same files. Use `three/addons/<path>.js`:

- It is the path in the official three.js docs and examples.
- The full file name with `.js` resolves under every resolver. The current extensionless form
  (`three/examples/jsm/controls/OrbitControls`) works in Vite 8 dev and build (verified). It fails in Node native ESM,
  in import maps and in strict bundlers, because the exports map adds no extension.

Target imports:

```js
import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
```

Apply the same rule to the library's own relative imports (`./src/globals.js`, not `./src/globals`). Vite accepts the
short form, but a browser import map and Node do not.

## Migration: geolib 3.3.3 to 4.0.1

| Change in 4.0.0 | Effect on this repo |
|-----------------|---------------------|
| No default export; `geolib/es/*` and `geolib/lib/*` deep imports removed | None. The code uses `import * as GEOLIB from "geolib"`. |
| `getDistance` uses the haversine formula (v3 used the spherical law of cosines with `acos`) | Results differ by millimetres. Default rounding to 1 m stays. At most a few vertices move by 1 m (0.01 scene units after `/100`). `sample/path.json` stays valid. |
| `computeDestinationPoint` radius, `getDistanceFromLine` rounding, `isPointInPolygon` antimeridian | Not used. |
| ES2020 output, IIFE browser build moved to `dist/geolib.iife.js` | None for Vite consumers. |

Measured on the Bruges centre: `getDistance([3.2, 51.2], citycenter)` returns 2179 in both versions;
`getRhumbLineBearing` differs in the 13th decimal.

Remove the unused `geolib` import from `src/path.js`.

**Important for the NaN fix:** geolib 3 and 4 both return `NaN` without an error when a "point" is an array of
arrays. `getDistance([[3.2, 51.2]], c)` returns `NaN` (verified in both versions). `src/city.js` passes every ring
element to `normalizeCoordinates()` and assumes the `Polygon` nesting depth. `sample/bruges.geojson` has one
`building` `MultiPolygon` (`relation/7745016`) and one `highway` `MultiPolygon`. Both sample files also have `highway`
features of type `Polygon` (40 in Bruges, 13 in small). These go to `generateRoad`, which expects a `LineString`. This
is the most probable cause of issue #2: a single `NaN` vertex makes the merged building geometry's bounding sphere
`NaN`. Confidence: MEDIUM. This is static analysis plus a geolib run; the full scene was not run. The fix belongs in
`create3dObjects` (dispatch on `geometry.type`). The geolib upgrade does not fix it.

## Testing WebGL in CI

### Recommended setup

Use Vitest browser mode with the Playwright provider and headless Chromium. Verified on 2026-11-02 (macOS, Node
26.12.1, Vitest 5.0.5, Playwright 1.64.1, Chromium Headless Shell 156): `new THREE.WebGLRenderer()` creates a WebGL 2
context on `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device ...), SwiftShader driver)`; `gl.readPixels` returns the
rendered colour; `ExtrudeGeometry.computeBoundingSphere()` returns a finite radius.

```js
// vitest.config.mjs
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
	test: {
		browser: {
			enabled: true,
			headless: true,
			provider: playwright({
				// Trusted test content only. Chromium deprecated the silent SwiftShader fallback (M130+);
				// the explicit opt-in keeps WebGL working on GPU-less CI runners.
				launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
			}),
			instances: [{ browser: "chromium" }],
		},
	},
});
```

### What the test asserts

The test must fail when the sample breaks, and it must pass on SwiftShader and on a real GPU. So assert numbers, not
images:

1. Set `global.config.data` to `/sample/small.geojson` (fast) and `/sample/bruges.geojson` (the issue #2 fixture).
   Vitest serves the repo root, so `fetch("/sample/...")` works. Do not use the default
   `/node_modules/storymap/...` URLs: they do not exist inside the library repo.
2. Spy on `console.error` and `console.warn`. three.js reports the issue #2 defect through `console.error`
   (`computeBoundingSphere(): Computed radius is NaN`). Any call fails the test.
3. After `generateCity`, check that every mesh and line in the scene has a finite `boundingSphere.radius` and no `NaN`
   in its `position` attribute.
4. Render one frame. Read the canvas pixels and assert that at least a set fraction differs from
   `color_background`. This catches "black canvas" and "empty city" regressions.
5. For `start()`: load `sample/path.json`, drive the scroll position from 0 to the end, and assert that the camera
   position stays finite. This catches the out-of-range scroll index defect.

`npm test` becomes `vitest run`.

## Installation

```bash
# Runtime dependencies (dependencies)
npm install three@^0.187.0 geolib@^4.0.1

# Dev dependencies
npm install -D vitest@^5.0.5 @vitest/browser-playwright@^5.0.5 playwright@^1.64.1 vite@^8.3.5

# Browser for tests (local: once; CI: every run, with OS packages)
npx playwright install chromium            # local
npx playwright install --with-deps chromium # CI (Ubuntu runner)
```

Health-check consumer, outside the repo: `npm create vite@latest` (vanilla template), then `npm install <path or
GitHub URL of this repo>`. Verified with Vite 8.3.5: a `file:`-linked package (symlink) serves
`/node_modules/<pkg>/sample/*.json` in `vite dev` with HTTP 200. `vite build` does not copy those files into `dist/`.
The default data URLs work only in dev. Record this in `INSTALLATION.md`; it is not a code defect.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vitest browser mode | `@playwright/test` with a fixture page | When the test must drive the real Vite consumer end to end (scroll the page, press `S` to download). It needs its own HTML page and server. It is a second runner; add it only if a Vitest browser test cannot reach a behaviour. |
| Vitest browser mode | Vitest + `jsdom` / `happy-dom` | Never for this library. Neither has WebGL. `WebGLRenderer` cannot start, so the NaN defect and the render cannot be tested. Mocking the renderer hides the bugs this milestone must find. |
| Vitest browser mode | Node + `headless-gl` (`gl` package) | Never. It gives WebGL 1 only. three.js has needed WebGL 2 since r163. Native build, poor Node 26 support. |
| Assertions on numbers and pixel counts | `expect.element(...).toMatchScreenshot()` (Vitest visual regression) | Later, when the look is stable and baselines come from the same CI image. SwiftShader and GPU output differ in anti-aliasing, so baselines are per environment. |
| `three/addons/...js` | `three/examples/jsm/...js` | Equivalent targets. Use the older path only if a tool cannot read export maps. Keep one spelling across the repo. |
| `three` in `dependencies` | `three` in `peerDependencies` + `devDependencies` | At npm publishing (v2.1). A peer dependency stops a duplicate three.js copy when a consumer also imports three. npm 7+ installs peers by default. Not needed while consumers install from GitHub. |
| `geolib` | A local equirectangular projection (about 10 lines) | At v2.1 API work, if dropping a dependency matters. Any projection change invalidates `sample/path.json`; regenerate it in the same change. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `--disable-gpu` in Chromium launch args | It adds nothing for WebGL tests. It still rendered on Headless Shell 156 on macOS (verified), but third-party reports say it breaks WebGL on Chrome 130+ in some setups (LOW, anecdotal). | `--use-angle=swiftshader --enable-unsafe-swiftshader` |
| `@vitest/browser` with `provider: 'playwright'` (string) | Old config shape. Vitest 5 takes a provider factory from `@vitest/browser-playwright`. | `provider: playwright({...})` |
| Unpinned `^0.137.5`-style ranges with a gitignored lockfile | Every fresh install resolves different versions (geolib already drifted from 3.3.3 to 3.3.14). The health check cannot be reproduced. | Commit `package-lock.json` |
| `THREE.ExtrudeBufferGeometry`, `mergeBufferGeometries`, `MapControls` from `OrbitControls` | Removed or moved; see the migration table | `ExtrudeGeometry`, `mergeGeometries`, `controls/MapControls.js` |
| Deep imports `geolib/es/*` | Removed in geolib 4 | `import * as GEOLIB from "geolib"` or named imports |
| `WebGPURenderer` / `three/webgpu` | Different renderer, TSL materials; a rewrite of the scene code. No benefit for line and extrusion rendering at this scale. | `WebGLRenderer` |
| TypeScript, `@types/three` in the build | Project rule: plain JavaScript with JSDoc | JSDoc comments; `@types/three` 0.187.0 exists for editor hints only |
| CDN imports (`unpkg`, `jsdelivr`, `esm.sh`) in samples, tests or docs | Andrei's rule: load every library from a local copy | npm install + Vite |

## Stack Patterns by Variant

**If the CI runner has no GPU (GitHub-hosted `ubuntu-latest`):**
- Use the SwiftShader flags above and `chromium-headless-shell` (the Playwright default for headless).
- SwiftShader is CPU rendering. Building Bruges (about 21 000 extruded buildings) can take tens of seconds. Set
  `testTimeout` to 60 s for the Bruges test, or run Bruges only in CI and `small.geojson` in watch mode.

**If a test needs a visible browser locally (debugging):**
- Run `npx vitest --browser.headless=false`. Real GPU, same test code.

**If WebGL context creation fails in CI:**
- Check that the launch args reach the browser: log `gl.getParameter(gl.RENDERER)` in a smoke test.
- Fall back to the full `chromium` channel (`instances: [{ browser: "chromium", launch: { channel: "chromium" } }]`)
  with the same flags.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `vitest@5.0.5` | `vite@^6.4 \|\| ^7 \|\| ^8`, Node `^22.12 \|\| ^24 \|\| >=26` | Verified with Vite 8.3.5 on Node 26.12.1 |
| `@vitest/browser-playwright@5.0.5` | `vitest@5.0.5` exactly, `playwright@*` | Keep all `@vitest/*` packages on one version |
| `playwright@1.64.1` | Chromium 156.0.8078.4 (revision 1248) | Each Playwright release pins its browser revision; CI must run `playwright install` after a bump |
| `three@0.187.0` | WebGL 2 only | All target browsers qualify; headless Chromium qualifies through SwiftShader |
| `geolib@4.0.1` | ES2020 browsers, Vite ESM through `exports.import` | `"type": "commonjs"` in its package.json, but the `import` condition points at `dist/index.mjs` |

## Sources

- npm registry (`npm view`), 2026-11-02: `three` 0.187.0, `geolib` 4.0.1, `vitest` 5.0.5,
  `@vitest/browser-playwright` 5.0.5, `playwright` 1.64.1, `vite` 8.3.5, `prettier` 3.9.10; release dates and engines
  fields. HIGH.
- `three@0.187.0` and `geolib@3.3.3/3.3.4/3.3.14/4.0.1` tarballs, inspected locally: exports maps, addon file
  locations, `BufferGeometryUtils` exports, `PointLight` decay default, WebGL 1 removal message, `getDistance` source in
  v3 and v4. HIGH.
- Local run in a scratch folder outside the repo (Vitest 5.0.5 browser mode, Chromium Headless Shell 156, Node
  26.12.1, macOS): WebGL 2 on SwiftShader, pixel readback, extensionless addon resolution in Vite dev and build,
  `MapControls` import failure, `file:`-linked sample data served by `vite dev`. HIGH for macOS; MEDIUM for Linux CI.
- [three.js Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) (raw wiki fetched
  2026-11-02): r138 to r187 entries. HIGH (official).
- [geolib CHANGELOG](https://github.com/manuelbieh/geolib/blob/master/CHANGELOG.md) ·
  [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4357): 4.0.0 breaking changes, 4.0.1 docs only. HIGH
  (official, cross-checked with the tarball).
- [Vitest Browser Mode guide](https://vitest.dev/guide/browser/) ·
  [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4345): provider factory, `instances`, `headless`. HIGH
  (official, cross-checked by the local run).
- [Node.js releases](https://nodejs.org/en/about/previous-releases) ·
  [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4358) and
  [nodejs/Release schedule.json](https://github.com/nodejs/Release/blob/main/schedule.json): Node 26 LTS 2026-10-28,
  maintenance 2027-10-20, EOL 2029-04-30. HIGH.
- [Using Chromium with SwiftShader](https://chromium.googlesource.com/chromium/src/+/205191a32c9db91062c5342e901b2da2d67a49e5/docs/gpu/swiftshader.md)
  and [Intent to Remove: SwiftShader Fallback](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM/m/oLrB5up_BwAJ):
  automatic fallback deprecated from M130; explicit `--enable-unsafe-swiftshader` opt-in stays supported. MEDIUM (exact
  removal milestone not confirmed by an official release note).
- GitHub releases API, 2026-11-02: `actions/checkout` v7.0.1, `actions/setup-node` v7.1.0. HIGH.

---
*Stack research for: browser three.js story-map library, v1.1 Revive*
*Researched: 2026-11-02*
