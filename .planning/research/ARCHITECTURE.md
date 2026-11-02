# Architecture Research

**Domain:** Browser 3D story-map library (three.js city from OpenStreetMap GeoJSON, drawn path, scroll-driven camera). Milestone v1.1 Revive: harness, automated check, defect fixes, three.js upgrade.
**Researched:** 2026-11-02
**Confidence:** HIGH for the defect analysis and the harness layout (reproduced by local runs on 2026-11-02 against a copy of `HEAD`). MEDIUM for Linux CI WebGL flags (web sources only, not run).

**eli14 summary.** The library is a model railway: one shared toolbox (`GLOBAL`) and five workers who each take tools from it. The milestone adds a test track beside the layout (`examples/bruges/`) and an inspector who runs a train over it after every change (`npm test`). The inspector comes first, because the railway has not run since 2022. Then each worker repairs only their own section, so repairs can happen side by side. The new engine (three.js upgrade) goes on last, after the inspector can say "the old engine runs clean". Today's risk is small: a few broken rails. The future risk is larger: if the new engine goes on first, nobody can tell whether a derailment comes from the old rails or the new engine.

## Standard Architecture

### System Overview

```text
┌──────────────────────────────── repo root (one package.json) ────────────────────────────────┐
│                                                                                               │
│  Library (shipped, unchanged module set)                                                      │
│  ┌──────────────────────────── index.js: setup() start() global ─────────────────────────┐   │
│  │   src/initialize.js   src/city.js   src/path.js   src/animate.js                       │   │
│  │            \               |             |             /                               │   │
│  │             └──────────── src/globals.js (GLOBAL singleton) ──┘                         │   │
│  └───────────────────────────────────────▲──────────────────▲────────────────────────────┘   │
│                                          │ import            │ import (alias "storymap")      │
│  Checks (dev only)                       │                   │                                │
│  ┌──────────────────────────────────┐    │      ┌────────────┴──────────────────────────┐    │
│  │ vitest.config.mjs  test.projects │    │      │ examples/bruges/  (Vite app, humans)  │    │
│  │  ├─ "unit"    env node           │────┘      │  index.html  main.js  vite.config.mjs │    │
│  │  │   test/*.test.js              │           │  publicDir → ../../sample             │    │
│  │  └─ "browser" Vitest browser mode│           └───────────────────────────────────────┘    │
│  │      Playwright → Chrome/Chromium│                                                        │
│  │      test/*.browser.test.js      │                                                        │
│  └──────────────┬───────────────────┘                                                        │
│                 │ reads fixtures                                                              │
│  ┌──────────────▼───────────────────────────────────────────────┐                            │
│  │ sample/  bruges.geojson (26.7 MB)  small.geojson  path.json  │                            │
│  └──────────────────────────────────────────────────────────────┘                            │
└───────────────────────────────────────────────────────────────────────────────────────────────┘

  Outside the repo, one time: health-check consumer in a scratch folder, installed exactly as
  INSTALLATION.md says (GitHub URL or `npm pack` tarball). Its result goes into the health report.
```

### Component Responsibilities

| Component | Responsibility | Implementation for v1.1 |
|-----------|----------------|-------------------------|
| `index.js` (public API) | Start-up order; exports `setup`, `start`, `global` | Keep the three exports. Add `await` on the city and path steps so the returned promise means "scene ready". Pass the config object to `generateCity`. |
| `src/globals.js` | Shared state and config defaults | No structural change. `cameraLookStartPos` stays for compatibility, but no code passes it to `lookAt` any more. |
| `src/initialize.js` | Scene, camera, renderer, resize, render loop | Use `$.container` everywhere; throw a clear `Error` when the element is missing; give `lookAt` a `Vector3`. |
| `src/city.js` | GeoJSON to meshes | Dispatch by `geometry.type`; honour layer flags; skip empty categories before a merge. three.js renames land here in the upgrade. |
| `src/path.js` | Author mode: click-to-draw, save | Grow the point buffer; pass the event to `castRay`. |
| `src/animate.js` | Reader mode: scroll to camera and draw range | Clamp the segment index; delete dead functions. |
| `examples/bruges/` (new) | Human-facing demo and manual UAT page; matches `package.json` `directories.example` | Three files. Resolves `storymap` by a Vite alias to `../../index.js`. Serves `sample/` as `publicDir`. No own `package.json`. |
| `vitest.config.mjs` + `test/` (new) | `npm test`: fails when the sample breaks | Two Vitest projects: `unit` (Node) and `browser` (Vitest browser mode, Playwright provider). |
| Health-check consumer (scratch, not in repo) | One-time proof of the documented install path | A fresh `npm create vite` app outside the repo. Findings go to the health report, not to code. |

## Recommended Project Structure

```text
index.js                      # public API; signature unchanged
src/                          # five modules; same files, same star graph
sample/                       # fixtures; bruges.geojson is the only fixture that reproduces issue #2
examples/
└── bruges/
    ├── index.html            # markup from INSTALLATION.md (#container, shortcut list)
    ├── main.js               # import * as storymaps from "storymap"; set config.data/path; setup() or start()
    └── vite.config.mjs       # resolve.alias storymap → ../../index.js; publicDir → ../../sample
test/
├── city.test.js              # unit (Node): whole Bruges city has finite positions; layer flags; empty category
├── start.browser.test.js     # browser: start() on Bruges; camera finite at load and at scroll edges; no console.error
└── setup.browser.test.js     # browser: setup(); custom container id; mousemove raycast logs no NaN; 700 clicks kept
vitest.config.mjs             # test.projects: unit + browser
package.json                  # scripts: test = "vitest run", example = "vite examples/bruges"; devDependencies
```

### Structure Rationale

- **`examples/bruges/` with an alias, not a nested package.** A nested `examples/bruges/package.json` with `"storymap": "file:../.."` does not work. npm 11.20 exits with success and adds nothing when the link target is an ancestor folder (observed locally). An npm workspace does not help either, because npm does not link the root package into its own `node_modules`. The alias gives one install, one copy of `three`, and no symlink resolution issues. A local `vite build examples/bruges` with the alias succeeded on today's code (three 0.137.5, Vite 8.3.5).
- **`vite.config.mjs`, not `.js`.** The root `package.json` has no `"type": "module"`. Vite 8 warns about ESM syntax in a `.js` config that loads as CommonJS. The `.mjs` extension removes the warning without a change to how consumers load the package.
- **Vitest for the automated check, not `@playwright/test` against the example.** Vitest's own Vite server has the repo root as its root. It serves `/sample/bruges.geojson` with no extra config, imports `index.js` through the same resolver a Vite consumer uses, and runs Node and browser suites from one config. A Playwright-against-example setup needs a `webServer` block, a port and a second runner, and adds no coverage for this milestone.
- **Two projects, not browser mode only.** The NaN geometry scan needs no WebGL. In Node it runs the whole Bruges pipeline in about 8 s and runs on any machine. Only WebGL, DOM and scroll behaviour need the browser project.
- **One mode per browser test file.** `GLOBAL` arrays (`buildingArray`, `roadArray` and others) never reset, and listeners pile up. Vitest browser mode isolates each test file. One file per mode copies the "one mode per page load" rule from the codebase map.
- **The health check stays outside the repo.** It tests the documented install path (`npm install https://github.com/...`), including the default URLs `/node_modules/storymap/sample/...`. Those URLs exist only in a real install. The alias example cannot test them, and must not try to.

## Architectural Patterns

### Pattern 1: The returned promise means "ready" (compatible change)

**What:** `setup()` and `start()` are already `async`, but they do not wait for `generateCity()` or `animatePath()`. Their promise resolves before the city exists, and fetch errors become unhandled rejections. Add `await` to both steps.
**When to use:** Now. Tests need a ready signal, and this is the only one that needs no new API.
**Trade-offs:** Callers that do not `await` see no difference, because the render loop starts before the first `await`. Callers that `await` now wait for the GeoJSON download. A fetch failure now rejects the caller's promise instead of failing in the background.

```javascript
// index.js — signature and exports unchanged
async function start(config = { buildings: true, roads: true, water: true, green: true }) {
	initialize();
	animate();
	await generateCity(config);
	await animatePath();
}
```

### Pattern 2: Fix the NaN at the feature-dispatch boundary in `src/city.js`

**What:** Issue #2 is reproduced. `create3dObjects()` assumes `Polygon` rings for buildings, water and green, and a flat `LineString` for roads. `bruges.geojson` has 40 `highway` `Polygon` features (4 of them with more than one ring), 1 `highway` `MultiPolygon` and 1 `building` `MultiPolygon`. `generateRoad()` passes each element of `coordinates` to `normalizeCoordinates()`. For a multi-ring `Polygon` or a `MultiPolygon`, that element is a ring, not a point. geolib returns `NaN`, and 4 road lines (`ROAD0`–`ROAD3`) get `NaN` positions. In author mode the first `mousemove` raycasts layer 1 (roads). three.js then logs `THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN` once per bad road (4 lines, observed in Chrome). The `building` `MultiPolygon` gives an empty extrusion (0 vertices), so that building is silently absent.
**When to use:** One change in `create3dObjects()`. Convert every geometry to a list of polygons (each a list of rings) by `geometry.type`. Roads draw one line per ring or per `LineString`. Unknown types are skipped.
**Trade-offs:** Road areas render as outlines, which is how single-ring road polygons already behave. The error is not fatal: rendering continues and the 4 roads cannot be picked. The NaN error alone may therefore not explain "project not starting". The health check must confirm the real start failure.

```javascript
// src/city.js — shortcut: Point/MultiPoint skipped; GeometryCollection not handled (absent from sample)
function polygonsOf(geometry) {
	if (geometry.type === "Polygon") return [geometry.coordinates];
	if (geometry.type === "MultiPolygon") return geometry.coordinates;
	return [];
}
function linesOf(geometry) {
	if (geometry.type === "LineString") return [geometry.coordinates];
	if (geometry.type === "MultiLineString") return geometry.coordinates;
	return polygonsOf(geometry).flat(); // every ring as its own line
}
```

### Pattern 3: Layer flags gate both collection and spawn; empty categories never reach a merge

**What:** `setup()` passes four booleans where `generateCity(config)` expects one object, and the gates in `generateCity()` are commented out. Pass `config`; gate in `create3dObjects()` and in `generateCity()`. Treat a missing flag as "on" (`config.roads !== false`). The default parameter of `setup()` applies only when no argument is given, so `setup({ buildings: false })` would otherwise turn off all other layers too. `mergeBufferGeometries([])` reads `geometries[0].index` and throws, in 0.137.5 and (as `mergeGeometries`) in 0.187.0. A GeoJSON with no water already crashes today.
**When to use:** The same plan as Pattern 2, because both edit `create3dObjects()` and `generateCity()`.
**Trade-offs:** If an author turns off `roads` in `setup()`, drawing is impossible, because the raycaster hits only layer 1 (roads). Document this. Do not add a guard for it in v1.1.

### Pattern 4: Test through `global`, stub the edges, export nothing new

**What:** Tests read state through the public `global` and replace only browser edges: `fetch` in Node (`vi.stubGlobal`), and a `THREE.Scene` assigned to `global.scene` before `generateCity()`. No internal function needs a new export. This Node test was run against today's code and fails as expected, with `["ROAD0","ROAD1","ROAD2","ROAD3"]`:

```javascript
// test/city.test.js (unit project, Node)
vi.stubGlobal("fetch", async () => ({ json: async () => bruges }));
$.scene = new THREE.Scene();
await generateCity();
const bad = [];
$.scene.traverse((o) => { if (o.geometry?.attributes.position?.array.some(Number.isNaN)) bad.push(o.name); });
expect(bad).toEqual([]);
```

**When to use:** Every check in v1.1. In the browser project, set `global.scrollpercentage` directly and wait two animation frames. Then read `global.camera.position` and `global.camera.quaternion`. Wrap `console.error` to catch three.js warnings.
**Trade-offs:** Tests depend on `GLOBAL` field names. That is acceptable, because `global` is public API until v2.1 in any case.

### Pattern 5: File-local fixes along the star graph

**What:** No `src/*.js` module imports another `src/*.js` module. Every defect except the layer flags lives in one file. Plans that touch different files cannot conflict, so they can run in parallel waves.

| Defect (confirmed locally unless noted) | File | Fix |
|---|---|---|
| Bare `container` (lines 9, 10, 53, 71, 95, 96) | `src/initialize.js` | `$.container`; throw `Error("storymap: no element #<id>")` when `null` |
| `lookAt([13, 0, 6])`: the initial camera quaternion is `NaN` (observed: `[null,null,null,null]`). With `debug: false` and no controls, author mode never recovers. | `src/initialize.js` | `$.camera.lookAt($.cameraLookAtPos)` or `new THREE.Vector3(...$.cameraLookStartPos)` |
| Scroll index 0 reads `lineArrayBackup[-3..-1]` | `src/animate.js` | Clamp the 1-based index to `[1, N - 1]`. Observed effect: the camera jumps to world origin, at position `(4, 3, 5)`, for scroll 1.0–1.6 %. The effect is not `NaN`, because `new Vector3(undefined)` defaults to 0. `CONCERNS.md` says `NaN`; correct it. The upper edge stays in range at `N = 61`. |
| 600-point buffer | `src/path.js` | When `lineClickCounter + 1` reaches capacity, double the `Float32Array`, copy it, build a new `BufferGeometry` on `$.line`, and `dispose()` the old one. A buffer attribute cannot change size after upload. |
| Ambient `event` in `castRay()` | `src/path.js` | Same plan as the buffer: `castRay(e)` from the `mousemove` listener |
| Layer flags + NaN dispatch + empty merge | `index.js` + `src/city.js` | Patterns 2 and 3, one plan |
| Dead code (`drawTube`, `moveCameraToStart`, `cameraFollowCurve`, unused imports) | `src/animate.js`, `src/path.js`, `src/globals.js` | Delete. `drawTube` references `ExtrudeGeometry` and would otherwise need upgrade work. |

## Data Flow

### Request Flow (reader mode, after the fixes)

```text
consumer main.js
    ↓ sets global.config, calls start(config)
index.js ── initialize() ──→ GLOBAL.scene/camera/renderer        (container lookup: fails loudly)
    │      animate()  ──→ rAF render loop (reads GLOBAL)
    ↓ await
src/city.js  fetch(config.data) → features
    ↓ per feature: polygonsOf/linesOf → normalizeCoordinates (geolib, /100) → geometries
    ↓ gate by flags; skip empty; merge per category
    └─→ GLOBAL.scene.add(BUILDINGS, ROADn, WATER, GREEN, ground)
    ↓ await
src/animate.js  fetch(config.path) → [[x,y,z]…] → GLOBAL.lineArray / lineArrayBackup / cameraPath / line
    ↓ scroll listener → GLOBAL.scrollpercentage
    └─→ rAF: playScrollAnimations → clamped index → GLOBAL.camera + line draw range
    ↓
start() promise resolves (ready)  ←── tests and later demos await this
```

### Check Flow

```text
npm test → vitest run
  ├─ unit (Node):  sample/bruges.geojson → stubbed fetch → generateCity() → traverse GLOBAL.scene → assert finite, flags, no throw
  └─ browser (Chrome via Playwright):  Vitest Vite server (root = repo) serves /sample/* →
        start()/setup() → await → set scroll / dispatch events → read GLOBAL.camera, GLOBAL.line, console.error → assert
```

### State Management

`GLOBAL` stays the only store in v1.1. Two facts shape the tests:

1. **Accumulation.** `buildingArray`, `roadArray`, `waterArray` and `greenArray` are never cleared. Listeners on `document` and `window` are never removed. Two rAF loops run, one in `initialize.js` and one in `animate.js`. A second `setup()` or `start()` on the same page doubles all of these. Keep one mode per page and one mode per test file.
2. **Two config channels.** Layer flags arrive as the argument of `setup()`/`start()`. Everything else arrives through `global.config`. Do not merge the two channels in v1.1.

### Key Data Flows

1. **Projection.** lat/lon → `normalizeCoordinates()` → scene x/z. `sample/path.json` stores scene coordinates, so any projection change invalidates it. A spot check of geolib 3.3.14 against 4.0.1 gave identical output for two Bruges points. Pin golden values in `test/city.test.js` before the geolib upgrade.
2. **Sample URLs.** The default `config.data` and `config.path` (`/node_modules/storymap/sample/...`) work only under `vite dev` in a real install. `vite build` does not copy them, so a production build gets 404s. The example sets explicit URLs. The docs fix should say this.

## Suggested Build Order

Dependencies, from the code:

```text
harness (vitest config, example) ──→ red tests ──→ fixes (parallel by file) ──→ three/geolib upgrade ──→ docs
health check (scratch, parallel to harness) ──┘                                     ↑
index.js await ──→ browser tests use the promise instead of polling ─────────────────┘ (safety net)
```

1. **Harness and health check (no library change).** Add the devDependencies `vitest`, `@vitest/browser-playwright`, `playwright` and `vite`, plus `vitest.config.mjs` and `examples/bruges/`. Run the scratch health check in parallel and record what fails. Leave three at 0.137.5. Today's code builds and renders under Vite 8 in a fresh consumer (verified with an `npm pack` tarball).
2. **Red tests.** Write the checks for every confirmed defect. They must fail on today's code. This proves that the check "fails when the sample breaks". The NaN test must use `bruges.geojson`. `small.geojson` has no multi-ring road areas and passes today (verified: 0 NaN features).
3. **Fixes, one plan per file group, in parallel:** (a) `index.js` + `src/city.js`: await, flags, dispatch, empty guard; (b) `src/initialize.js`: container, `lookAt`; (c) `src/animate.js`: clamp, dead code; (d) `src/path.js`: buffer growth, event. Only (a) touches `index.js`. Each plan turns its own tests green.
4. **Dependency upgrade, after all tests pass.** three 0.137.5 → 0.187.0 breaks the build: Vite 8 stops with `MISSING_EXPORT` for `MapControls` from `controls/OrbitControls` and for `mergeBufferGeometries` (verified). `THREE.ExtrudeBufferGeometry` is `undefined` at run time. Extensionless `three/examples/jsm/...` paths still resolve in Vite, but add `.js` for other resolvers. Lighting and colour then change without errors: `PointLight` decay 2 (r147), physically correct lights (r155), colour management on (r152). The point light at (500, 1000, 500) will add almost no light, so the city will look darker. Judge this by eye in `examples/bruges/` or with a screenshot test. geolib 3 → 4 and the Node 26 toolchain go in the same phase. Upgrade without tests and two failure sources mix.
5. **Docs and package metadata, last.** `INSTALLATION.md`, `DOCS.md`, `package.json` URLs and `directories.example` describe the final behaviour. Also decide on a `files` field: `npm pack` today ships the 30 MB of samples to every consumer.

**Research flags:** step 4 needs a short visual-parity spike (lights and colour). Steps 1–3 and 5 use standard patterns.

## Scaling Considerations

Scale here means extract size and path length, not users.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Bruges (26.7 MB, ~21k buildings, ~3.7k roads) | Current design. The full city pipeline takes about 8 s in Node. Acceptable for v1.1. |
| Larger cities | Geometry build blocks the main thread. Move parsing and extrusion to a worker later. |
| Long authored paths | Buffer growth (Pattern 5) removes the 600-point cap. Reader mode already sizes from the file. |

### Scaling Priorities

1. **First bottleneck:** one `THREE.Line` per road (about 3,700 draw calls). Merge into one `LineSegments` per category after v1.1. The raycaster needs layer 1 on that object.
2. **Second bottleneck:** synchronous GeoJSON parse and extrusion on the main thread. Use a worker in v2.x.

## Anti-Patterns

### Anti-Pattern 1: Testing with `small.geojson` only

**What people do:** Use the small fixture for speed.
**Why it's wrong:** It contains none of the features that cause issue #2. The check passes while the default sample is broken.
**Do this instead:** Run the unit scan on `bruges.geojson` (about 8 s). Add a three-feature fixture if speed matters.

### Anti-Pattern 2: Upgrade three.js before the check exists

**What people do:** Start with the dependency refresh, because the old version is "the obvious problem".
**Why it's wrong:** The r151 renames break the build before any page renders. Light and colour changes then hide among real defects.
**Do this instead:** Harness, red tests, fixes on 0.137.5, then the upgrade.

### Anti-Pattern 3: A nested example package linked with `file:../..`

**What people do:** Give `examples/bruges/` its own `package.json` and depend on the parent.
**Why it's wrong:** npm 11 adds nothing and reports success. If the link works under another tool, Vite can still resolve a second copy of `three`.
**Do this instead:** Use a Vite alias and the root `node_modules`.

### Anti-Pattern 4: Start an instance API now

**What people do:** Fix the `GLOBAL` problems with a `createStoryMap()` refactor while the files are open.
**Why it's wrong:** It is out of scope for v1.1, and it breaks the demos that rely on `global`.
**Do this instead:** Keep the fixes file-local. Leave seams for later (next section).

## Where a later `createStoryMap(config)` with `dispose()` attaches

Do not build this in v1.1. The v1.1 fixes should leave these seams intact:

- **State.** Every module reaches state through `import { GLOBAL as $ }`. Later, each exported module function takes `$` as a parameter. `createStoryMap()` builds a fresh object shaped like `GLOBAL`. `setup()`/`start()` become wrappers that pass the singleton. The v1.1 fixes add no new module-level state. (`sphereMarker`, `LINEPOINTCOUNT` and `animationScripts` already exist and move onto `$` later.)
- **Readiness.** The awaited promise from Pattern 1 becomes `await createStoryMap(config)`.
- **Teardown inventory for `dispose()`.** Two rAF loops (keep their ids). The `resize` listener on `window` (`initialize.js`). The `scroll` listener on `document` (`animate.js`). The `mousedown`, `mousemove`, `click` and `keyup` listeners on `document` (`path.js`). Merged geometries, per-road geometries, the per-call building material, the renderer, and `controls`/`stats` in debug mode. Every listener added or changed in v1.1 should be a named function, not an anonymous arrow. A later `removeEventListener` then needs no rewrite.
- **Config.** `createStoryMap(config)` merges the argument flags and `global.config` into one object.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| `three` | Bare import plus `three/examples/jsm/*` addons, resolved by the consumer bundler | The exports map has `./examples/jsm/*` and `./addons/*` (0.187.0). The import names change in r151. |
| `geolib` | `getDistance`, `getRhumbLineBearing` in `normalizeCoordinates()` | 4.0.1 gave the same output as 3.3.14 on a spot check. Pin golden values first. |
| Vite (consumer and example) | Plain ES modules, no build step in the repo | Vite 8.3.5 builds today's code. The default sample URLs work in dev only. |
| Playwright / Chrome | Vitest browser provider | On macOS, `playwright({ launchOptions: { channel: "chrome" } })` ran WebGL headless with the installed Chrome (verified). On a GPU-less Linux CI runner, Chromium needs `--enable-unsafe-swiftshader` for WebGL, because automatic SwiftShader fallback is deprecated (MEDIUM, not run). Per-instance provider options do not merge with the parent options. |
| GitHub install (`npm install <github url>`) | The documented consumer path | Covered only by the scratch health check. `npm pack` shows that the tarball has no `files` filter. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `index.js` ↔ `src/city.js` | `generateCity(config)` call | The only cross-file coupling in the fixes. Change both in one plan. |
| `src/*` ↔ `src/globals.js` | Direct mutation of `GLOBAL` | Unchanged in v1.1. This is the later instance-API seam. |
| tests ↔ library | Public `setup`/`start`/`global` + stubbed `fetch` | No test-only exports. |
| `examples/bruges` ↔ library | Vite alias `storymap` → `index.js` | Root `node_modules` gives one copy of `three`. |
| render loop ↔ scroll loop | Both read `GLOBAL` every frame | Two rAF loops. Keep both in v1.1. |

## Sources

- Local reproduction, 2026-11-02, on `git archive HEAD` in `/tmp/storymap-probe` (Node 26.12.1, npm 11.20.0, Vite 8.3.5, Vitest 5.0.5, three 0.137.5 and 0.187.0, geolib 3.3.14 and 4.0.1, Chrome via Playwright 1.64.1): NaN road count, the console error text, the camera quaternion, scroll-edge camera positions, the Vite `MISSING_EXPORT` errors, the alias example build, the `file:../..` no-op. HIGH.
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`, and the source files `index.js` and `src/*.js` at `HEAD`.
- [Vitest browser mode guide](https://vitest.dev/guide/browser/) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4345). Seam tier LOW; the config shape was confirmed by a local run.
- [Vitest Playwright provider config](https://vitest.dev/config/browser/playwright) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4354). Seam tier LOW; `launchOptions` was confirmed by a local run.
- [three.js Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4321). Seam tier LOW; the r151 renames were confirmed by a local build.
- [Chromium: Using Chromium with SwiftShader](https://chromium.googlesource.com/chromium/src/+/205191a32c9db91062c5342e901b2da2d67a49e5/docs/gpu/swiftshader.md) and [blink-dev: Intent to Remove: SwiftShader Fallback](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM/m/oLrB5up_BwAJ). Read through search results only; LOW to MEDIUM.

---
*Architecture research for: storymap v1.1 Revive*
*Researched: 2026-11-02*
