# Project Research Summary

**Project:** storymap (milestone v1.1 Revive)
**Domain:** Browser 3D story-map library: a three.js city from an OpenStreetMap GeoJSON export, a path the author draws, a camera that follows the path on scroll. Plain-JavaScript ES modules that consumers load through Vite.
**Researched:** 2026-11-02
**Confidence:** HIGH for defects, API changes and harness layout (local runs). MEDIUM for Linux CI WebGL and for the look after the upgrade.

## Executive Summary

`storymap` is a small library: about 970 lines and two runtime dependencies (`three` 0.137.5, `geolib`). It builds a token-free 3D city from one Overpass export. The author clicks a path on the roads in the browser, and scroll position drives the camera along that path continuously. No comparable tool offers this combination. The code has not run under supervision since 2022. An outside user reports that the project does not start (issue #2). v1.1 adds no features. It must prove that the library runs, fix what the proof finds, and then move to current dependencies.

Recommended approach: health check and test harness first, on the pinned 2022 versions. Then write red tests for each confirmed defect, and fix them file by file. Then upgrade to `three` 0.187.0 and `geolib` 4.0.1 in one step, with Node 26 for the toolchain. Update the docs last. The test harness is Vitest 5: a Node project for the geometry scan and a browser project (Playwright, headless Chromium) for WebGL, scroll and DOM. Tests assert numbers (finite positions, finite camera, no `console.error`, non-background pixels), not screenshots. Keep `setup()`, `start()` and `global` unchanged. Keep `normalizeCoordinates()` unchanged byte for byte.

Main risks. (1) Issue #2 is a parser defect, not a three.js defect. An upgrade first mixes two failure sources. (2) The NaN console error does not stop rendering. So a fix for the NaN alone may not fix "does not start". (3) The upgrade changes lighting and colour without any error, so a visual baseline from r137 must exist first. (4) Any change to the projection silently moves `sample/path.json` off the roads.

**eli14:** The library is a model railway that has stood in the attic since 2022. First, put an inspector beside the track, and let the old engine run once while the inspector writes down every fault. Then repair each section of track. Put the new engine on last. If the new engine goes on first, nobody can tell whether a derailment comes from the old rails or the new engine. Today the risk is small: a few broken rails. Later the risk is larger: without the inspector, the next engine change breaks the railway again and nobody notices.

## Key Findings

### Recommended Stack

One dependency change in a late phase: `three` `^0.187.0` and `geolib` `^4.0.1`. Node 26 LTS goes in `.node-version`, with no `engines` field. Commit `package-lock.json`: it is gitignored today, and `geolib` already drifted from 3.3.3 to 3.3.14. Add no build step, no TypeScript, no WebGPU and no CDN imports.

**Core technologies:**
- `three` 0.187.0: scene and renderer. Three renames are required: `ExtrudeBufferGeometry` becomes `ExtrudeGeometry`, `mergeBufferGeometries` becomes `mergeGeometries`, and `MapControls` now comes from `controls/MapControls.js`. Use `three/addons/<path>.js` with the `.js` extension.
- `geolib` 4.0.1: the existing `import * as GEOLIB` works. Output differs from 3.x by at most `3.5e-11` scene units (measured).
- Vitest 5.0.5 with `@vitest/browser-playwright` 5.0.5, `playwright` 1.64.1 and `vite` 8.3.5: one test runner, Node and browser projects from one `vitest.config.mjs`. jsdom and happy-dom cannot test this library, because they have no WebGL.

### Expected Features

"Features" here means behaviours a working library must show. The work adds nothing new.

**Must have (v1.1, P1):**
- I1: a fresh install as `INSTALLATION.md` describes gives a running scene (issue #2)
- R1/R2: reader scroll from 0 % to 100 % with no jump and no `NaN`, also on a short page (one function, one fix)
- I2: any container id works (this fix also covers resize, R4)
- I3: layer flags work in `setup()` and `start()`
- A4: no silent 600-point path limit
- I5: docs match code (`R` reset, `Z` undo, `X` redo; `./src/` paths; repo URLs)
- I7: an automated check that fails when the sample breaks
- I6: current dependencies, with the check green before and after

**Should have (P2, only if the health check confirms):**
- A1: author can navigate with `debug: false` (no `MapControls` today)
- A2: clicks land correctly in a container smaller than the window
- R3: debug controls do not fight the scroll camera
- I4: a visible load error instead of a blank canvas

**Defer (v2.x):** npm publish under a scoped name (the licence comes first), path visible behind buildings, building highlight, a simple instance API with `dispose()`, routing between clicks, tiles, and WebGPU.

### Architecture Approach

Keep the star graph: `index.js` plus four `src/*.js` modules, each of which mutates the `GLOBAL` singleton and none of which imports another. Every defect except the layer flags lives in one file. So the fix plans can run in parallel without conflicts. Add `examples/bruges/`, a Vite app that aliases `storymap` to `../../index.js` and serves `sample/` as `publicDir`. Do not use a nested `file:../..` package: npm 11 silently does nothing. Tests use only the public `global` and stub `fetch`. They need no new exports.

**Major components:**
1. `index.js`: public API. Add `await` on `generateCity(config)` and `animatePath()`, so the returned promise means "scene ready" and load errors reach the caller.
2. `src/city.js`: GeoJSON to meshes. Dispatch on `geometry.type` (`polygonsOf` / `linesOf`), gate the layer flags (a missing flag means on), and skip empty categories before a merge.
3. `src/initialize.js`: use `$.container`, throw a clear error when the element is missing, and pass a `Vector3` to `lookAt`.
4. `src/animate.js`: clamp the scroll index and delete dead code. `src/path.js`: grow the point buffer, and pass the event to `castRay`.
5. `vitest.config.mjs` + `test/`: a `unit` project (Node; Bruges NaN scan, about 8 s) and a `browser` project (one mode per test file, because `GLOBAL` never resets).
6. Health-check consumer: a scratch Vite app outside the repo, installed exactly as the docs say. Only this consumer tests the default `/node_modules/storymap/sample/...` URLs (they work in `vite dev` only).

### Critical Pitfalls

1. **Treating issue #2 as an upgrade problem.** Reproduce it on r137 with `bruges.geojson`, not `small.geojson` (0 bad features). Fix it at the parser boundary in `create3dObjects()`. Never filter it out of the data.
2. **Declaring "starts" after the NaN error is gone.** Define "starts" as observable state: meshes exist with finite bounding spheres, the camera is finite, and no `console.error` occurs. Also test a real export with `Point` features tagged `natural`, and a dataset with no water (`mergeGeometries([])` throws).
3. **Upgrading with no r137 baseline.** Capture screenshots on r137 in the health check. After the upgrade, the far `PointLight` gives near-zero light (decay 2, physically correct lights). Replace it with a `DirectionalLight` and scale intensities by about pi. Keep colour-management defaults.
4. **Projection drift.** Do not tidy `normalizeCoordinates()`. Add a path-on-road invariant test (today the worst distance is `4.2e-7` units; the limit is `0.001`) and golden values before any refactor.
5. **A headless WebGL test that passes without WebGL.** Assert a WebGL 2 context and scene state. Use Playwright's Chromium with `--enable-unsafe-swiftshader` (Playwright 1.64.1 already adds it; the explicit flag in STACK.md is harmless). Do not pass `--disable-gpu`.

## Where the Research Files Disagree

| Topic | Positions | Evidence | Resolution |
|-------|-----------|----------|------------|
| Cause of issue #2 | STACK.md: NaN from `MultiPolygon` / road `Polygon`, "most probable cause", static analysis (MEDIUM). FEATURES.md: data or parser, not version drift (inference). PITFALLS.md: the `building` `MultiPolygon` puts NaN into `BUILDINGS`, plus 4 NaN roads. ARCHITECTURE.md: 4 NaN roads (`ROAD0`–`ROAD3`) log the error on the first author-mode `mousemove`; the `building` `MultiPolygon` gives an empty extrusion (0 vertices), not NaN. | ARCHITECTURE.md has the local scene run in Chrome (error text and road names observed). PITFALLS.md counted features locally but did not run the scene for the building. | Use ARCHITECTURE.md: 4 NaN roads, 1 silently missing building. The error is not fatal. ARCHITECTURE.md and PITFALLS.md agree that the NaN may not explain "does not start". Strong other candidates: `lookAt([13,0,6])` gives a NaN camera quaternion, from which author mode never recovers with `debug: false` (ARCHITECTURE.md, observed); an unawaited `generateCity()` that throws on `Point` features or an empty merge (PITFALLS.md); the bare `container` global. The health check decides. If the fixes do not match the report, ask the issue author for the dataset. |
| Scroll index 0 | `CONCERNS.md` and FEATURES.md: `NaN`. ARCHITECTURE.md: no NaN; the camera jumps to world origin, at position `(4, 3, 5)`, for scroll 1.0–1.6 %, because `new Vector3(undefined)` defaults to 0. The upper edge stays in range at N = 61. | ARCHITECTURE.md has the local run (camera positions at the scroll edges observed). | Use ARCHITECTURE.md: an origin jump. Correct `CONCERNS.md`. The fix (clamp) is the same. A separate real NaN source remains: a page not taller than the viewport (R2, divide by zero). |
| Unit test runner | FEATURES.md and PITFALLS.md: `node --test`. PITFALLS.md calls a proposal for Vitest a warning sign. STACK.md and ARCHITECTURE.md: Vitest 5 with Node and browser projects. | STACK.md and ARCHITECTURE.md ran Vitest locally. The ARCHITECTURE.md Node test fails on today's code as expected. | Use Vitest. The browser project needs it anyway, so it adds no second runner. PITFALLS.md is still right that the source must be importable: add `.js` to relative imports, and consider `"type": "module"`. |
| Fixture in CI | STACK.md: Bruges in CI with a 60 s timeout. PITFALLS.md: `small.geojson` in the CI browser job. ARCHITECTURE.md: Bruges is required for the NaN test. | All agree that `small.geojson` does not reproduce issue #2. | Bruges in the Node unit project (about 8 s). `small.geojson` in browser tests, with one Bruges browser test that has a long timeout. |
| `three` as a peer dependency | STACK.md: at v2.1 npm publish. PITFALLS.md: in the dependency-refresh phase. | PITFALLS.md verified two copies of `three` (583 kB bundle) in a fresh consumer. | Decision for the roadmap. Recommendation: do it in the refresh phase, because the duplicate copy is a verified consumer defect and the change is small. |

## Implications for Roadmap

Suggested phases: 5. All four files give the same order: baseline, check, fixes on r137, upgrade, docs.

### Phase 1: Health check and baseline (on r137)
**Rationale:** Without a record of which defects are real on the 2022 versions, no later failure can be traced to the code or to `three`.
**Delivers:** A health report from a scratch consumer installed as the docs say. It covers I1, A1–A5 and R1–R6, issue #2 reproduced on Bruges, `npm ls three`, r137 screenshots (`setup()`, `start()` at 0 / 50 / 100 %, fixed viewport and DPR), and one mobile-viewport run.
**Addresses:** I1, candidate defects A1, A2, R3.
**Avoids:** Pitfalls 1, 2, 3.

### Phase 2: Test harness and red tests
**Rationale:** The check must exist, and fail on today's code, before anything changes. It can start in parallel with phase 1.
**Delivers:** `vitest.config.mjs` (unit + browser), `examples/bruges/`, `npm test` = `vitest run`, path-on-road invariant, golden `normalizeCoordinates()` values, and a red test for each confirmed defect. Optional CI workflow (`actions/setup-node@v7`, `node-version-file`, `playwright install --with-deps chromium`).
**Uses:** Vitest 5, `@vitest/browser-playwright`, Playwright 1.64.1, Vite 8.
**Addresses:** I7.
**Avoids:** Pitfalls 4, 7, 8.

### Phase 3: Defect fixes on r137
**Rationale:** The fixes are file-local (star graph), so plans run in parallel waves. Each plan turns its own tests green.
**Delivers:** (a) `index.js` + `src/city.js`: await, layer flags, geometry dispatch, empty-merge guard. (b) `src/initialize.js`: `$.container`, `lookAt` with a `Vector3`. (c) `src/animate.js`: index clamp, short-page guard, dead code removed. (d) `src/path.js`: buffer growth or a visible limit, event passed to `castRay`. Plus the P2 items that phase 1 confirms.
**Addresses:** I1, I2, I3, R1, R2, R4, A4 (and A1, A2, R3, I4 if confirmed).
**Avoids:** Pitfalls 1, 2; anti-pattern "instance API now".

### Phase 4: Dependency refresh
**Rationale:** It comes last among code changes, with all tests green, so each break shows against a known baseline.
**Delivers:** `three` 0.187.0, `geolib` 4.0.1, Node 26 `.node-version`, committed lockfile, `three/addons/*.js` imports, the three renames, lighting change (`DirectionalLight`, pi scale) checked against the r137 screenshots. Probably `three` as a peer dependency (see disagreements).
**Addresses:** I6.
**Avoids:** Pitfalls 3, 5, 6.

### Phase 5: Docs and package metadata
**Rationale:** The docs describe the final behaviour, so they come last.
**Delivers:** `INSTALLATION.md` (keys, dev-only sample URLs, tagged GitHub install), `DOCS.md` paths, `package.json` URLs and `directories.example`, and a decision on a `files` field (the tarball ships 30 MB of samples today). Every documented command runs again in a fresh consumer.
**Addresses:** I5, A3.

### Phase Ordering Rationale

- Baseline before tests before fixes before upgrade: each step makes the next one's failures traceable.
- Phase 3 splits by file, because no `src/` module imports another.
- The upgrade is one jump to r187. Intermediate releases add no safety, because the tests are the check.

### Research Flags

Needs research during planning:
- **Phase 4:** a short visual-parity spike for lighting and colour after r155 / r152. The pi factor and the far-light result are reasoning (MEDIUM), not observed.
- **Phase 2 (CI part only):** WebGL on a GPU-less Linux runner was not run. Confirm with a smoke test that logs `gl.getParameter(gl.RENDERER)`.

Standard patterns (skip research): Phase 1, Phase 3, Phase 5.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm registry, tarballs and a local Vitest browser run on macOS. Linux CI is MEDIUM. |
| Features | MEDIUM | Codebase facts HIGH. Competitor facts LOW to MEDIUM (single web reads). |
| Architecture | HIGH | Defects, harness layout and the upgrade build errors reproduced locally on a copy of `HEAD`. |
| Pitfalls | HIGH / MEDIUM | Tarball and run facts HIGH. Lighting appearance MEDIUM. SwiftShader removal milestone LOW. |

**Overall confidence:** HIGH for the order and the defect list. MEDIUM for the root cause of "does not start".

### Gaps to Address

- **Real cause of issue #2:** the NaN error is reproduced, but no file proves that it stops start-up. Phase 1 must observe the real failure. If needed, ask the issue author for the dataset.
- **Candidate defects A1, A2, R3:** they come from reading the code. Phase 1 confirms or rejects them, and the roadmap decides the scope.
- **Linux CI WebGL:** not run.
- **Look after the upgrade:** not observed. It needs the r137 screenshots from phase 1.
- **`three` as a peer dependency, and the `files` field:** these are decisions for Andrei, with recommendations above.
- **Datasets with `Point` features or nested `properties.tags`:** no such fixture exists in the repo. Phase 2 needs a small hand-made one.

## Sources

### Primary (HIGH confidence)
- Local runs on 2026-11-02 (Node 26.12.1, npm 11.20.0, Vite 8.3.5, Vitest 5.0.5, Playwright 1.64.1, Chromium Headless Shell 156 and Chrome): NaN road count and error text, camera quaternion, scroll-edge camera positions, `MISSING_EXPORT` errors on r187, alias example build, `file:../..` no-op, duplicate `three` in a consumer, SwiftShader WebGL 2 and pixel readback.
- Tarballs `three@0.187.0`, `geolib@3.3.4/3.3.14/4.0.1`, `playwright-core@1.64.1`; npm registry metadata.
- [three.js Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4321), cross-checked against the tarball.
- [Node.js releases](https://nodejs.org/en/about/previous-releases) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4358).
- Codebase: `index.js`, `src/*.js`, `sample/*`, `.planning/codebase/*`, `.planning/PROJECT.md`, issue storytellingmap/storymap#2.

### Secondary (MEDIUM confidence)
- [Vitest Browser Mode guide](https://vitest.dev/guide/browser/) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4345), confirmed by a local run.
- [geolib CHANGELOG](https://github.com/manuelbieh/geolib/blob/master/CHANGELOG.md) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4357).
- Mapbox GL JS 3.5 `line-occlusion-opacity` (two sources agree); [mapbox/storytelling](https://github.com/mapbox/storytelling) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4318).

### Tertiary (LOW confidence)
- Chromium SwiftShader doc and blink-dev "Intent to Remove: SwiftShader Fallback" (exact removal milestone).
- three.js forum on r155 lighting; competitor READMEs (digidem, Scrollama, deck.gl, ArcGIS, Codrops); scrollytelling accessibility notes.

---
*Research completed: 2026-11-02*
*Ready for roadmap: yes*
