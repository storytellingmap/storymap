# Feature Research

**Domain:** Browser library for scroll-driven 3D story maps (three.js city from an OpenStreetMap GeoJSON export, a
path drawn by the author, a camera that follows the path on scroll)
**Researched:** 2026-11-02
**Confidence:** MEDIUM. Facts about this codebase are HIGH (read from `src/`, `index.js`, `sample/` and the `three`
0.187.0 package). Facts about other tools are MEDIUM or LOW (web sources, single reads).

**Milestone context:** v1.1 Revive adds no features. In this document, "feature" means a behaviour that a working
library must show. Each table stake is mapped to an Active item in `PROJECT.md`, or is marked as a note for a later
milestone.

## eli14 summary

The library is like a model railway kit. The kit builds a small town from a map. The author lays the track by
clicking on the streets. The reader then scrolls, and a toy train rides the track with a camera on its roof.
"Working" means three things. The kit assembles from the box with the printed instructions. The author can lay track
and save it. The train rides from start to end without derailing. Today the box instructions are wrong in places.
Some parts no longer fit the current version of the tools. Nobody checks the kit before it ships. v1.1 fixes exactly
that, and adds no new wagons. The wagons the 2022 review asked for, such as a track that stays visible behind houses,
wait for v2.1.

## Feature Landscape

### Table Stakes (Users Expect These)

A missing table stake makes the library look broken. Three user roles exist: the integrator (installs the package),
the author (draws the path in `setup()`), and the reader (scrolls the story in `start()`).

#### Integrator: the library installs and starts

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| I1. Fresh install as `INSTALLATION.md` says gives a running scene | Every comparable tool starts from its README in minutes. The Mapbox template states its one setup blocker (the access token) up front. Issue #2 says this project does not start. | MEDIUM | v1.1 Active: health report, issue #2. The `^0.137.5` range on a 0.x version resolves only to 0.137.x. A fresh install today still gets `three` 0.137, so issue #2 is probably not caused by version drift. The likely cause is in the data or the parser (see `CONCERNS.md`, wrong geometry types). The health check must confirm the cause. |
| I2. Any container id works | The config exposes `container`. A user expects any id to work. | LOW | v1.1 Active: bare `container` identifier. `initialize()` and `resize()` read the global `container`, not `$.container`. |
| I3. Layer flags do what they say | `setup({ water: false })` is in the public signature. | LOW | v1.1 Active: ignored layer flags. `start()` passes the whole object as the first argument of `generateCity`. |
| I4. A failed load is visible | A wrong `data` or `path` URL gives a blank canvas today. All mature map tools surface load errors. | LOW | Not named in the Active list. It is cheap and it makes I1 diagnosable. Treat it as part of the issue #2 fix only if the health check shows that it hides the cause. Otherwise record it for later. |
| I5. Docs match code | Wrong docs are the most common reason a sample "does not start". | LOW | v1.1 Active: `INSTALLATION.md` key list (Z is undo, not reset), `DOCS.md` paths (`./js/` is `./src/`), `package.json` URLs and `directories.example`. |
| I6. Current dependencies | A library pinned to a 2022 `three` cannot sit next to a current `three` in a consumer app without two copies. | MEDIUM | v1.1 Active. Verified against `three` 0.187.0: `ExtrudeBufferGeometry` is gone, `mergeBufferGeometries` is now `mergeGeometries` (r151), and `MapControls` is no longer exported from `OrbitControls.js` (it lives in `controls/MapControls.js` since r151). `three/examples/jsm/*` still resolves; `three/addons/*` is the current alias. `geolib` 4.0.1 is the current major. |
| I7. An automated check that fails when the sample breaks | Without it, the next three.js upgrade breaks the library silently again. | MEDIUM | v1.1 Active. Two layers fit: a `node --test` suite for the pure functions (projection, path index math, save format), and one browser smoke run of the Bruges sample. The smoke run asserts "no console error, the canvas is not empty, the camera position is finite after a scroll". It does not compare screenshots pixel by pixel (see Anti-Features). |

#### Author: `setup()` draws and saves a path

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| A1. Navigate the city (pan, zoom, rotate) while drawing | An author must reach every street. | LOW | Health check item. In `src/initialize.js`, `MapControls` is created only when `config.debug == true`. With `debug: false`, the author probably cannot move the camera. This is a candidate defect; the health report must confirm it. |
| A2. Clicks land on roads only | The README promises a path along roads. | LOW | Works by design: the raycaster tests layer 1 (roads). The mouse position is computed from `window.innerWidth/innerHeight`, not from the canvas rectangle. A container smaller than the window will probably shift the clicks. Candidate defect for the health report. |
| A3. Undo, redo, reset, save with the documented keys | The on-page help is the author's only manual. | LOW | v1.1 Active (docs). The code uses `R` reset, `Z` undo, `X` redo, `S` save. |
| A4. The saved path is complete and valid | A truncated path breaks the reader story silently. | LOW | v1.1 Active: silent 600-point limit. The minimum fix is to stop at the limit and say so, or to grow the buffer. |
| A5. The saved path reloads in `start()` unchanged | Author output is reader input. | LOW | Holds as long as `normalizeCoordinates()` is unchanged. Any projection change invalidates `sample/path.json` (`PROJECT.md` constraint). |

#### Reader: `start()` plays the story on scroll

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| R1. The line draws and the camera follows from 0 % to 100 % scroll without a jump or a `NaN` | This is the core value. The Codrops 2015 StorytellingMap (the stated inspiration) and every scrollytelling template scrub continuously in both scroll directions. | LOW | v1.1 Active: out-of-range scroll indexes. Clamp the index to `[0, LINEPOINTCOUNT - 2]`. |
| R2. Short pages do not break the animation | Hosts vary. A page that is not taller than the viewport gives a `NaN` scroll percentage today. | LOW | Same root as R1 (`getScrollPercentage`). Fix it in the same change. |
| R3. The camera is not fought by the mouse controls | Readers expect the scroll to drive the camera. | LOW | Health check item. With `debug: true`, `$.controls.update()` runs every frame in reader mode and calls `lookAt` on its own target. That probably overrides the scroll camera. Candidate defect. |
| R4. Resize keeps the scene correct | Readers rotate phones and resize windows. | LOW | A `resize` handler exists. It uses the same bare `container` global as I2, so the I2 fix covers it. |
| R5. Native scroll and keyboard scroll still work | Accessibility guidance on scrollytelling says: no scroll hijacking, native scroll stays intact. | — | Holds today: the library only reads `scroll` events. Keep it that way. |
| R6. Mobile touch scroll plays the story | Most readers of a story page are on phones. | LOW | Document `scroll` events fire on touch scroll. The health report should record one mobile-viewport run. Author mode is desktop-only (mouse events); that is acceptable. |

### Differentiators (Competitive Advantage)

These set `storymap` apart from the comparable tools. They align with the Core Value. None of them is new work for
v1.1; v1.1 must keep them working.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| D1. 3D city from a raw Overpass export, no tile server, no API key | The Mapbox template needs an access token and Mapbox Studio. The MapLibre fork needs a style and tiles, and a Node server for gzipped vector tiles. `storymap` needs one GeoJSON file and static hosting. | Existing | Keep. Do not add a tile or token dependency. |
| D2. In-browser path authoring on the roads | Mapbox and MapLibre templates set camera keyframes by hand-written `center`, `zoom`, `pitch`, `bearing` in `config.js`. ArcGIS StoryMaps tours use points from a feature layer. Click-to-draw on roads is rare. | Existing | Keep. The path is straight segments between clicks; it is not routed (see Anti-Features). |
| D3. Continuous scroll-scrubbed path and camera | The chapter templates (Mapbox, MapLibre, MapTiler, Cesium patterns) jump between discrete views with `flyTo` on step enter. `storymap` maps scroll position to a position on the path, like the Codrops demo, but in 3D. deck.gl `TripsLayer` gives the same "line draws itself" effect with a `currentTime` playhead, but leaves scroll binding and the city to the developer. | Existing | Keep. This is the feature the health check must prove. |
| D4. Small footprint | Two runtime dependencies (`three`, `geolib`), about 970 lines of source. | Existing | Keep. The `geolib` use is two functions; replacing it with a local helper is optional and not in v1.1. |
| D5. (v2.1) Path visible behind buildings | Mapbox GL JS 3.5 added `line-occlusion-opacity` to fade the hidden part of a line behind 3D objects. This shows that the problem is real and that "fade, do not hide" is the accepted answer. | MEDIUM | Not v1.1. In three.js the usual answer is two passes: a normal pass, then a faded pass with `depthTest: false`. A single `depthTest: false` shows the whole path through every building. The 2022 review offered an alternative: an arrow at the path head. The path sits at `y = -0.002`, under the road meshes, and the camera offset is fixed at `(+4, +3, +5)`; both make occlusion likely. |
| D6. (v2.1) Highlight described buildings as the reader approaches | Comparable templates change layer opacity per chapter (`onChapterEnter` / `onChapterExit` in the Mapbox template). Proximity-based highlighting along a continuous path has no direct template equivalent. | MEDIUM | Not v1.1. Needs building identity, which the merged building mesh does not keep today. |
| D7. (v2.1) Simple integration API | Scrollama is the reference shape: `setup({ step, offset, progress })` plus `onStepEnter`, `onStepExit`, `onStepProgress`, and `destroy()`. It ships on npm and as a script tag. | MEDIUM | Not v1.1. `PROJECT.md` requires `setup()`, `start()` and `global` to keep working until then. |
| D8. (v2.1) Install from npm | Every comparable library in this list is on npm except the copy-the-template tools (Mapbox, MapLibre storytelling). | LOW | Not v1.1. The unscoped npm name `storymap` belongs to an unrelated package (version 2.4.0, a markdown tool). Publishing needs a scoped name, for example `@storytellingmap/storymap`. The licence must change from `UNLICENSED` first; that is a v2.0 decision. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Any new feature in v1.1 (chapters, text sync, markers, highlighting) | Comparable templates have chapters with text, markers and per-chapter layers. | `PROJECT.md` scopes v1.1 to the health check and fixes. New features on code that has not run since 2022 hide which change broke what. | Record ideas for v2.1. Finish v1.1 with a green check first. |
| Pixel-exact screenshot comparison as "the real automated check" | It looks like the most complete test of a 3D scene. | Headless Chromium renders WebGL through SwiftShader. Output differs by GPU, driver and flags, and a screenshot of an unready canvas is blank without an error. Baselines break on every `three` upgrade, which is the next planned change. | Assert invariants: no console error, the WebGL renderer string exists, the canvas has non-background pixels, the camera position is finite at scroll 0 %, 50 % and 100 %. Add `node --test` units for the pure functions. |
| Road routing or map matching between clicks | A path that follows streets between clicks looks better. | Needs a road graph or an external router (OSRM, GraphHopper). This adds a service or a large dependency, and changes the saved path format. | Keep click-on-road with short segments. Document "click often on curves". |
| Tiles, level of detail, streaming of large cities | `bruges.geojson` is 26.7 MB in the repo, and parsing blocks the main thread. | A tiling layer is a different product (that is what MapLibre and Cesium are). `PROJECT.md` excludes other map sources. | Keep the single-file input. Recommend the smaller extract (`small.geojson`) for demos. Measure load time in the health report only. |
| 3D terrain, Cesium, Mapbox or 3dbuildings sources | They appear in `SOURCES.md` as references. | Out of Scope in `PROJECT.md`. Each one adds a token or a server. | None. |
| Adaptive render resolution | Listed in the 2022 research questions. | `ANSWERS.md` records it as not needed. | None. |
| Scroll hijacking or a custom smooth-scroll layer | Some cinematic scroll demos (GSAP ScrollSmoother) use it. | Breaks keyboard scroll, screen readers and the browser's scroll restoration. Accessibility guidance on scrollytelling warns against it. | Keep native `scroll`. A later API may accept a progress value (0..1) from the host, so the host can use Scrollama or GSAP ScrollTrigger itself. |
| WebGPU renderer, TypeScript rewrite, module restructure | Current three.js promotes `three/webgpu` and TSL; many libraries move to TypeScript. | Both are rewrites. `PROJECT.md` sets plain JavaScript with JSDoc. The dependency refresh must stay on `WebGLRenderer`. | Upgrade `three` in one step on `WebGLRenderer`; rename the three APIs listed in I6. |
| Mobile authoring (touch drawing) | Phones are common. | Authoring is a one-time desktop task; touch raycasting and pinch-zoom conflicts add work for no reader value. | Document author mode as desktop-only. |
| A path import button in the page | `CONCERNS.md` lists it as missing. | A new feature; not in the Active list. | Keep `config.path`. Record it for v2.1 with the API work. |

## Feature Dependencies

```
I6 dependency refresh (three 0.187, geolib 4)
    └──requires──> I7 automated check (to prove the upgrade did not break the sample)
                       └──requires──> I1 sample runs on the pinned 0.137 versions (baseline)
                                          └──requires──> health report (records the baseline)

R1 scroll index clamp ──same function as──> R2 short-page NaN (getScrollPercentage / updateLine)

I2 container identifier ──also fixes──> R4 resize

A4 600-point limit ──protects──> A5 saved path reloads ──feeds──> R1 reader animation

I5 docs ──enhances──> I1 (the health check follows the docs; wrong docs fail it)

D8 npm publish ──requires──> v2.0 licence decision + scoped package name
D7 simple API ──conflicts in v1.1 with──> compatibility constraint (setup/start/global stay)
D6 building highlight ──requires──> building identity (today all buildings merge into one mesh)
D5 path behind buildings ──requires──> I6 (do it on the current three, not on 0.137)
```

### Dependency Notes

- **The health report comes first.** It records which defects are real on the pinned 2022 versions. Without that
  baseline, a defect after the upgrade cannot be traced to the code or to `three`.
- **The check comes before the upgrade.** The upgrade touches `src/city.js`, `src/initialize.js` and `src/path.js`.
  The check is what proves the Bruges sample still runs after it.
- **R1 and R2 share one function.** Fix both in one change, with one unit test for the index math.
- **`sample/path.json` is coupled to the projection.** The refresh of `geolib` 4 must not change
  `normalizeCoordinates()` output. A unit test on known coordinates detects that.
- **All v2.1 items depend on v1.1 and v2.0.** D5 to D8 build on current `three`, a licence, and the monorepo.

## MVP Definition

### Launch With (v1.1 Revive)

- [ ] Health report on the documented install path (I1, A1 to A5, R1 to R6 observed and recorded) — it decides which
  defects are real
- [ ] Issue #2 reproduced and fixed (I1) — an outside user is blocked
- [ ] Confirmed defects fixed: container id (I2), layer flags (I3), scroll indexes (R1, R2), 600-point limit (A4)
- [ ] Docs corrected (I5, A3)
- [ ] Automated check that fails when the sample breaks (I7)
- [ ] Dependency refresh with the check green before and after (I6)

The candidate defects A1, A2 and R3 come from reading the code. They are not in the Active list. The health report
records them. Whether they are fixed in v1.1 is a scope decision for the roadmap; the Active item "fix the defects the
health check confirms" can cover them.

### Add After Validation (v2.0 Monorepo)

- [ ] Licence other than `UNLICENSED` — needed before D8
- [ ] Repository move; the check (I7) moves with the code

### Future Consideration (v2.1 2022 review items)

- [ ] D8 npm publish under a scoped name — after the licence
- [ ] D5 path visible behind buildings — after the `three` upgrade
- [ ] D6 highlight buildings near the camera — needs building identity
- [ ] D7 simple integration API — the one point where `setup()`, `start()` and `global` may change

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| I1 sample starts (issue #2) | HIGH | MEDIUM | P1 |
| R1/R2 scroll without `NaN` | HIGH | LOW | P1 |
| I7 automated check | HIGH | MEDIUM | P1 |
| I2 container id | MEDIUM | LOW | P1 |
| I3 layer flags | LOW | LOW | P1 (Active) |
| A4 600-point limit | MEDIUM | LOW | P1 |
| I5 docs | HIGH | LOW | P1 |
| I6 dependency refresh | MEDIUM | MEDIUM | P1 |
| A1/A2/R3 candidate defects | MEDIUM | LOW | P2 (if the health check confirms) |
| I4 visible load error | MEDIUM | LOW | P2 |
| D8 npm publish | HIGH | LOW | P3 (v2.1) |
| D5 path behind buildings | HIGH | MEDIUM | P3 (v2.1) |
| D7 simple API | MEDIUM | MEDIUM | P3 (v2.1) |
| D6 building highlight | MEDIUM | MEDIUM | P3 (v2.1) |

**Priority key:**
- P1: Must have for v1.1
- P2: Should have, add when the health check confirms the need
- P3: Later milestone

## Competitor Feature Analysis

| Feature | Mapbox storytelling template | MapLibre storymap (digidem) | deck.gl | Cesium | Codrops StorytellingMap (2015) | ArcGIS StoryMaps guided tour | storymap (this repo) |
|---------|------------------------------|-----------------------------|---------|--------|--------------------------------|------------------------------|----------------------|
| Story structure | Chapters in `config.js`, each with a camera view | Chapters, same model | None (rendering framework) | None built in; `flyTo` per step; KML tour classes | One path, scroll-scrubbed | Numbered points, scroll from point to point | One path, scroll-scrubbed |
| Camera motion | `flyTo` / `easeTo` / `jumpTo` per chapter; optional rotation | `flyTo` per chapter | View-state transitions | `camera.flyTo` | 2D pan follows the path head | Map moves to each point | Fixed offset follows the path head |
| Animated line | Not built in (custom layer) | Not built in | `TripsLayer` with a `currentTime` playhead and fading trail | Possible, custom | SVG path draws on scroll | "Progress lines" between points | Line draws on scroll (`setDrawRange`) |
| 3D buildings | From Mapbox style; `use3dTerrain` | From the style | Via layers | 3D Tiles | No (2D) | 3D scene toggle | Extruded from OSM `building:levels` |
| Line behind buildings | `line-occlusion-opacity` since GL JS 3.5 | Not documented | Not documented | Not documented | Not applicable | Not documented | Hidden today (v2.1 item D5) |
| Path authoring | Hand-written coordinates | Hand-written coordinates | Code | Code | Bezier path in a vector tool | Points from a feature layer or geotagged photos | Click on roads in the browser |
| Keys and accounts | Access token required | None; Node server for gzipped tiles | None | ion token for hosted assets | None | ArcGIS account | None |
| Distribution | Copy the template (BSD-3) | Copy the template | npm | npm | Demo source | Hosted SaaS | GitHub URL install (v2.1: npm) |
| Reduced motion | Not documented | Not documented | Not applicable | Not documented | Not documented | Not documented | Not handled (not in scope) |

**Conclusion.** The chapter templates own the "discrete views" model. deck.gl owns the "animated trail" primitive.
`storymap` owns the combination: a token-free 3D city, a path authored in the browser, and a continuous scroll
scrub. v1.1 must make that combination run again, nothing more.

## Sources

Codebase (HIGH): `src/initialize.js`, `src/animate.js`, `src/path.js`, `src/city.js`, `src/globals.js`, `index.js`,
`sample/path.json` (61 points), `.planning/codebase/CONCERNS.md`, `PROJECT.md`. `three` 0.187.0 package inspected
with `npm pack` (exports map, `BufferGeometryUtils.js` exports, `MapControls.js`). `npm view storymap` (unrelated
package, version 2.4.0) and `npm view three` / `npm view geolib` (0.187.0 / 4.0.1), all on 2026-11-02.

Web (confidence from the classify-confidence seam: single web source LOW, cross-checked MEDIUM):
- [mapbox/storytelling](https://github.com/mapbox/storytelling) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4318) — config options, token requirement, BSD-3 (MEDIUM, matches the Mapbox Labs tutorial)
- [digidem/maplibre-storymap](https://github.com/digidem/maplibre-storymap) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4317) — chapters, Scrollama, Node server for gzipped tiles (LOW)
- [deck.gl TripsLayer](https://deck.gl/docs/api-reference/geo-layers/trips-layer) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4315) — `currentTime`, `trailLength`, `fadeTrail` (LOW, official docs)
- [Scrollama](https://github.com/russellsamora/scrollama) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4360) — reference API shape for D7 (LOW, official README)
- [three.js Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4321) — r151 `mergeGeometries` and `three/addons`, r163 WebGL 1 removal (MEDIUM, cross-checked against the 0.187.0 package)
- [Codrops: Animated Map Path for Interactive Storytelling](https://tympanus.net/codrops/2015/12/16/animated-map-path-for-interactive-storytelling/) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4322) — 2015, canvas/SVG, path scrubbed by scroll (LOW; the page returned HTTP 403, facts from search snippets)
- Mapbox GL JS 3.5.0 release notes and the `line-occlusion-opacity` style property ([newreleases.io](https://newreleases.io/project/npm/mapbox-gl/release/3.5.0), [Mapbox Android docs](https://docs.mapbox.com/android/maps/api/latest/mapbox-maps-android/com.mapbox.maps.extension.style.layers.generated/-line-layer-dsl/line-occlusion-opacity.html)) (MEDIUM, two sources agree)
- three.js forum on lines through meshes ([discourse.threejs.org](https://discourse.threejs.org/t/draw-line-always-on-top-of-transparent-sprites/55807)) — `depthTest: false` shows the whole line; two passes needed for a fade (LOW)
- ArcGIS StoryMaps guided tours ([UN geoportal help](https://geoportal.un.org/arcgis/portalhelp/en/storymaps/author-and-share/add-guided-tours.htm), [Esri blog](https://www.esri.com/arcgis-blog/products/story-maps/constituent-engagement/map-tour-enhancements)) (LOW)
- Headless WebGL testing ([microlink: WebGL without a GPU](https://microlink.io/blog/webgl-without-a-gpu), [MorePET/mat#41](https://github.com/MorePET/mat/issues/41)) — SwiftShader fallback, blank-canvas risk (LOW, consistent across sources)
- Scrollytelling accessibility ([UW KB: ArcGIS StoryMaps accessibility](https://kb.wisc.edu/131965), [web-stories-wp#7567](https://github.com/GoogleForCreators/web-stories-wp/issues/7567)) — native scroll, reduced motion (LOW)
- Cesium camera tours ([KmlTourFlyTo](https://cesium.com/learn/cesiumjs/ref-doc/KmlTourFlyTo.html)) (LOW)

---
*Feature research for: scroll-driven 3D story-map library (maintenance milestone v1.1 Revive)*
*Researched: 2026-11-02*
