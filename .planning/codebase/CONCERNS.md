---
last_mapped_commit: 29755b9a527ac50aa8e3f7ee73bc365a2e92da7d
last_mapped_at: 2026-11-02
---
# Codebase Concerns

**Analysis Date:** 2026-11-02

## Tech Debt

**Public `setup()` / `start()` config flags are ignored:**
- Issue: `setup()` passes four booleans (`config.buildings`, `config.roads`, `config.water`, `config.green`) as separate positional arguments to `generateCity`, which takes one object. `start()` passes the whole object. `generateCity` never reads any flag: the four `if (config.x)` blocks are commented out and every layer always spawns.
- Files: `index.js` (lines 18 and 32), `src/city.js` (`generateCity`, the commented block near the end)
- Impact: Callers who disable layers get no effect. Their intent is silently dropped. `setup()` also passes the wrong shape, so a future re-enable of the flags would read `undefined`.
- Fix approach: Pass one config object from both entry points. Read the flags inside `generateCity` and guard each `spawn*` call. Add a test that disables a layer and checks that no mesh is added.

**Global mutable state in a module-level singleton:**
- Issue: All state lives on one exported object, `GLOBAL` in `src/globals.js`. Every module mutates it directly (`$.line`, `$.lineArray`, `$.camera`, `$.hit`, and others). There is no teardown.
- Files: `src/globals.js`, `src/initialize.js`, `src/city.js`, `src/path.js`, `src/animate.js`
- Impact: Two calls to `setup()` or `start()` in one page create two render loops, two renderers, two canvases and duplicate listeners. Nothing can be disposed. Tests cannot run two scenes in one process.
- Fix approach: Wrap the state in a factory (`createStoryMap(config)`) that returns an instance. Add a `dispose()` method that cancels `requestAnimationFrame`, removes listeners, and disposes geometries and renderer.

**Dead and broken code kept in the source:**
- Issue: `drawTube()` in `src/animate.js` (line 104) uses an undefined `shape`. `moveCameraToStart()` (line 256) uses an undefined `location` (this resolves to `window.location`, which is the wrong type). `cameraFollowCurve()` (line 266) calls `camera.position.set(camPos)` with a vector, which does not match the signature. `showScrollPercentage()` is empty. A stray `// function cameraM` fragment remains. `onMouseMove()` in `src/path.js` is never called. `spawnSpline()` is defined and never called. Unused imports include `GEOLIB` and `Vector3` in `src/path.js`, and `GEOLIB` and `LineMaterial` in other files.
- Files: `src/animate.js`, `src/path.js`, `src/city.js`, `src/globals.js`
- Impact: The code looks like a working feature but is not. Anyone who revives a commented block inherits a runtime error. Bundlers keep the dead code.
- Fix approach: Delete the unused functions and imports. Keep the commented camera animations out of the source, or move them to a branch.

**Commented-out code blocks mixed with live code:**
- Issue: Long commented regions remain in `src/city.js` (old `generateGeometry` mesh code, the `spawn*` flag block), `src/path.js` (`// window.addEventListener("mousemove"...)`), `src/animate.js` (an entire commented `updateLine` variant and camera animations), and `src/initialize.js` (light helpers, the `light2` line, grid).
- Files: `src/city.js`, `src/animate.js`, `src/path.js`, `src/initialize.js`
- Impact: The live logic is hard to see. Dead branches go stale and mislead readers.
- Fix approach: Remove the comments. Git history keeps the old code.

**Duplicate and inconsistent projection code:**
- Issue: `normalizeCoordinates()` in `src/city.js` converts lon/lat to metres with `geolib`, then divides by a hard-coded `100`. The result is offset by the raw `citycenter` degrees, which are not converted to metres. The bearing function is rhumb-line while the distance is great-circle. The sign is flipped on x with the comment "Reverse X (it work)".
- Files: `src/city.js` (`normalizeCoordinates`), `src/globals.js` (`citycenter`)
- Impact: The scene origin depends on the sample constants. Saved paths in `sample/path.json` use the same projection. Changing `citycenter`, the city, or the `/100` scale invalidates every saved path and the camera start position (`cameraLookStartPos`, `cameraLookAtPos` in `src/globals.js`).
- Fix approach: Use one documented projection (for example, a local equirectangular or a Mercator helper). Store paths in lon/lat, or record the projection parameters with each saved path file.

**Deprecated three.js API and version lock:**
- Issue: `ExtrudeBufferGeometry` (`src/city.js` line 154) is the old name of `ExtrudeGeometry`. `package.json` pins `three` to `^0.137.5`, which allows only 0.137.x. Imports use `three/examples/jsm/...` paths that moved in later releases.
- Files: `src/city.js`, `package.json`
- Impact: The library cannot take current three.js security or performance fixes without a migration. The deprecated alias is removed in newer releases.
- Fix approach: Move to a current three.js release. Rename to `ExtrudeGeometry`. Update the addon import paths. Test the render output against the sample data.

**No `engines` field and no lockfile in version control:**
- Issue: `package.json` has no `engines` field. `.gitignore` lists `package-lock.json` twice and excludes it, so installs are not reproducible. `package.json` also points `directories.example` at a missing `examples` folder.
- Files: `package.json`, `.gitignore`
- Impact: Consumers get different `three` and `geolib` trees over time. The runtime version is not stated.
- Fix approach: Declare `engines` for the current Node LTS line. Commit the lockfile for this repo (for an app or demo). Remove the missing `directories.example` entry.

## Known Bugs

**Custom container id throws a ReferenceError:**
- Symptoms: Scene setup fails with `container is not defined` when `global.config.container` is set to any id other than `container`.
- Files: `src/initialize.js` (lines 9, 10, 53, 71, and in `resize()` at lines 95-96)
- Trigger: Set `storymaps.global.config.container = "map"` (or any other id). `initialize()` reads the bare identifier `container` instead of `$.container`. Only the browser's named-element lookup makes `container` resolve, and only when the id is literally `container`.
- Workaround: Use the id `container` in the host page, as the README sample does.

**Point count above 600 corrupts the saved path:**
- Symptoms: `savePath()` writes `null` entries, or the drawn line stops updating.
- Files: `src/path.js` (`initializeDynamicLine` line 70, `addPoint` line 146-150, `savePath`)
- Trigger: Click more than 600 times while drawing. The typed array holds 600 points. Writes past index 599 are ignored, but `lineClickCounter` keeps increasing. `savePath()` then reads `undefined` for those indexes.
- Workaround: Press `R` to reset before reaching 600 points. The limit is not shown to the user.

**Documentation key mapping does not match the code:**
- Symptoms: The on-page help shows `Z` as "reset". In code, `Z` is undo, `X` is redo, and `R` is reset.
- Files: `INSTALLATION.md` (shortcut list), `src/path.js` (`onKeyUp`)
- Trigger: Follow the install guide and press `Z` to reset.
- Workaround: Use `R` to reset.

**Scroll animation reads out-of-range path points:**
- Symptoms: The camera position and look-at become `NaN` for the first fraction of a percent of scroll, and near the end of the scroll range.
- Files: `src/animate.js` (`updateLine` inside the path animation script)
- Trigger: At `index = 0`, the code reads `lineArrayBackup[-3..-1]`, which are `undefined`. Near the end, `index + 1` equals `LINEPOINTCOUNT`, so `b` is `undefined`. Typed arrays ignore writes to negative indexes, so the bad state persists silently.
- Workaround: None in code. Clamp `index` to `[0, LINEPOINTCOUNT - 2]` and skip the update when the scroll range is empty.

**Typed-array writes outside the array are silent:**
- Symptoms: Positions are not stored and no error is raised.
- Files: `src/animate.js` (`$.lineArray[(index - 1) * 3 - 3]` writes), `src/path.js` (`addPoint`, `updateLine`)
- Trigger: Any index outside `[0, length)`. JavaScript typed arrays discard these writes without an error.
- Workaround: None. Add explicit bounds checks.

**Scroll percentage becomes `NaN` on short pages:**
- Symptoms: `$.scrollpercentage` is `NaN` when the page is not taller than the viewport. The scroll animation never runs and no error is shown.
- Files: `src/animate.js` (`getScrollPercentage`)
- Trigger: `scrollHeight - clientHeight` equals `0`, so the division returns `NaN`.
- Workaround: Make the host page taller than the viewport.

**Unhandled promise rejections on load:**
- Symptoms: A missing or invalid GeoJSON or path file leaves a blank scene. The error appears only in the console as an unhandled rejection.
- Files: `index.js` (`setup`, `start` do not await `generateCity` or `animatePath`), `src/city.js` (`loadGeoJsonAsync`), `src/animate.js` (`loadPath`)
- Trigger: A wrong `config.data` or `config.path` URL. `fetch` does not reject on HTTP 404, so the JSON parser fails instead.
- Workaround: Check the URL in the browser network panel.

**Some GeoJSON geometry types are parsed as the wrong shape:**
- Symptoms: Wrong or missing meshes. Exceptions are possible.
- Files: `src/city.js` (`create3dObjects`, `generateBuilding`, `generateRoad`, `generateWater`, `generateGreen`)
- Trigger: `create3dObjects` assumes `Polygon` for buildings and water and green areas, and `LineString` for roads. The bruges sample contains 1 `MultiPolygon` building and 1 `MultiPolygon` road. It also contains 40 `Polygon` roads, which go to the `LineString` path. Code paths for `Point` features with `natural` or `leisure` tags also exist, and `generateWater` or `generateGreen` would receive a flat `[lon, lat]` array. The sample has no such features, so this path is not exercised by the provided data. The effect on a real Overpass export is not verified by running the code.
- Workaround: Filter the data to `LineString` roads and `Polygon` areas before loading. Or handle `MultiPolygon` by iterating its polygons.

**`mergeBufferGeometries` result is not checked:**
- Symptoms: A layer with no features can produce a `Mesh` with a `null` geometry, which may fail during render.
- Files: `src/city.js` (`spawnBuildings`, `spawnWater`, `spawnGreen`)
- Trigger: A dataset with no water or no green features. This is not verified by running the code. Check the return value in the installed three.js version.
- Workaround: Skip the spawn call when the array is empty.

## Security Considerations

**Remote data and paths are loaded without validation:**
- Risk: `config.data` and `config.path` are fetched and parsed with no schema check. A malformed or hostile file can throw, or produce `NaN` coordinates that corrupt the scene.
- Files: `src/city.js` (`loadGeoJsonAsync`), `src/animate.js` (`loadPath`)
- Current mitigation: The URLs are set by the developer in code. The default paths are local.
- Recommendations: Check that the loaded JSON is an array of three numbers (path) or a FeatureCollection (GeoJSON). Reject `NaN`. Do not treat data from users as trusted without these checks.

**Keyboard shortcuts run on any keyup in the document:**
- Risk: `S`, `R`, `Z`, and `X` fire from any element, including inputs placed in the host page. Pressing `S` triggers a file download.
- Files: `src/path.js` (`initializeEventListeners`, `onKeyUp`)
- Current mitigation: None.
- Recommendations: Ignore key events whose target is an `input`, `textarea`, or `contenteditable` element. Use a modifier key for the download.

**Object URL for downloads is never revoked:**
- Risk: Each save leaks a blob URL and its memory until page unload.
- Files: `src/path.js` (`savePath`, inner `download`)
- Current mitigation: None.
- Recommendations: Call `URL.revokeObjectURL` after the click.

**Reliance on the deprecated `window.event` global:**
- Risk: `castRay()` reads `event.clientX` from the implicit global `window.event`. This is deprecated and not part of the standard listener contract. It can break in other embedding contexts.
- Files: `src/path.js` (`castRay`, lines 125-126)
- Current mitigation: Works in current browsers.
- Recommendations: Pass the `MouseEvent` into `castRay(event)` from the listener.

## Performance Bottlenecks

**Raycast against the whole scene on every mouse move:**
- Problem: Each `mousemove` on the document creates a new `Raycaster`, `Vector2` objects, and calls `intersectObjects($.scene.children)`. Roads are thousands of separate `THREE.Line` objects. Buildings are one merged mesh.
- Files: `src/path.js` (`castRay`, `mousemove` listener at lines 23-31)
- Cause: The raycast is not filtered to the road layer before testing. Objects are tested in a flat list. Every move is raycast even when the cursor is not drawing.
- Improvement path: Keep one `Raycaster` at module scope. Intersect only the roads array (`$.roadArray` objects), not the whole scene. Throttle to one raycast per animation frame.

**Thousands of individual geometries before merge:**
- Problem: Each building is built as its own `ExtrudeBufferGeometry`, then merged. The bruges sample has about 21,400 building polygons.
- Files: `src/city.js` (`create3dObjects`, `generateGeometry`, `spawnBuildings`)
- Cause: Geometry is built per feature in JavaScript, with `THREE.Shape` objects created for each ring.
- Improvement path: Build one `BufferGeometry` directly from the triangle arrays, or stream the GeoJSON into chunks. Measure with the browser performance panel before and after.

**Debug mode is on by default:**
- Problem: `config.debug` defaults to `true`. This adds `Stats`, `AxesHelper`, `MapControls` with damping, and `controls.update()` on every frame.
- Files: `src/globals.js` (`config.debug`), `src/initialize.js` (the `if ($.config.debug == true)` block and `animate()`)
- Cause: The default config targets development. The README example also sets `debug: true`.
- Improvement path: Default `debug` to `false`. Document it as a development switch.

**Map controls fight the scroll camera:**
- Problem: In debug mode, `MapControls` updates the camera every frame. The scroll animation in `src/animate.js` also sets the camera position and look-at. The two writes conflict.
- Files: `src/initialize.js` (`animate`), `src/animate.js` (`updateLine`)
- Cause: Both modules write to `$.camera` in the same frame with no ownership rule.
- Improvement path: Disable `controls` when `start()` runs, or make the scroll animation the only camera writer.

**Re-created objects on every event:**
- Problem: `castRay()` allocates new objects per event. `updateLine()` sets `needsUpdate` and `setDrawRange` on each move.
- Files: `src/path.js` (`castRay`, `updateLine`)
- Cause: Allocation inside the hot path.
- Improvement path: Reuse module-level objects.

## Fragile Areas

**Projection constants tied to the sample dataset:**
- Files: `src/city.js` (`normalizeCoordinates`), `src/globals.js` (`citycenter`, `cameraLookStartPos`, `cameraLookAtPos`, `cameraStartPos`), `sample/path.json`
- Why fragile: The scene origin, the camera start, and the saved path all depend on the same magic numbers. A change to any one of them moves the others out of alignment.
- Safe modification: Change `citycenter`, the city, or the projection together with a new `path.json`. Re-record the path after any projection change.
- Test coverage: None.

**Global `$` object shared across modules:**
- Files: `src/globals.js` and every module that imports it
- Why fragile: Any module can change any field. The order of `initialize()`, `generateCity()`, and `generatePath()` matters. For example, `initializeMarker()` needs `$.scene`, and `animatePath()` needs `$.line` created in `drawLine()`.
- Safe modification: Keep calls in the order they appear in `index.js`. Do not call `setup()` and `start()` in the same page.
- Test coverage: None.

**Load order between `setup`, `generateCity`, and the path code:**
- Files: `index.js`, `src/city.js`, `src/path.js`
- Why fragile: `generateCity` is async and is not awaited. `generatePath()` runs before the city meshes exist. Interaction with the scene can start before data is loaded.
- Safe modification: `await generateCity(...)` in `setup()` and `start()`, and only then call the path functions.
- Test coverage: None.

**Scroll animation depends on hard-coded ranges:**
- Files: `src/animate.js` (`animationScripts`, `scalePercent(1, 101)`, `start: 1`, `end: 101`)
- Why fragile: The 1-to-101 range and the `+4/+3/+5` camera offset are magic numbers. The scroll percentage is never clamped. The index math assumes the path has at least two points.
- Safe modification: Name the constants. Clamp the percentage to `[0, 100]`. Guard the path length.
- Test coverage: None.

**Module-level counters in the animation module:**
- Files: `src/animate.js` (`LINEPOINTCOUNT`, `DRAWRANGE`, `X`)
- Why fragile: `LINEPOINTCOUNT` is set by `animatePath()` after an async load. `DRAWRANGE` and `X` are unused.
- Safe modification: Keep state in `$` or a per-instance object. Delete the unused variables.
- Test coverage: None.

**Named globals in `src/initialize.js` and `src/city.js`:**
- Files: `src/initialize.js` (bare `container`), `src/path.js` (`event` in `castRay`)
- Why fragile: Both resolve through browser implicit globals. Refactoring or a different embedding breaks them silently.
- Safe modification: Use `$.container` and pass the event explicitly.
- Test coverage: None.

## Scaling Limits

**Drawing path capacity:**
- Current capacity: 600 points (`max_points` in `src/path.js` line 70).
- Limit: The 601st click corrupts the saved output (see Known Bugs).
- Scaling path: Size the array from the points actually needed, or grow it when full.

**Building count and page load:**
- Current capacity: About 21,400 building polygons in `sample/bruges.geojson` (1.35 MB), merged into one mesh.
- Limit: Not measured in this repo. Parse and triangulation happen on the main thread before the first frame.
- Scaling path: Move parsing to a worker. Pre-process GeoJSON to a binary mesh format at build time.

**Single-file GeoJSON input:**
- Current capacity: One request for the whole city, with no tiling or level of detail.
- Limit: Larger cities need more memory and longer load times. Not measured.
- Scaling path: Tile the data by bounding box, as Overpass `bbox` already allows.

## Dependencies at Risk

**`three` 0.137 (`package.json`):**
- Risk: The version is from 2022. It lacks later security and performance fixes. Its `examples/jsm` import paths differ from the current addon layout.
- Impact: The build can break on a fresh install under newer bundlers. Upgrading requires changes to `src/city.js`, `src/initialize.js`, `src/path.js`, `src/animate.js`, and `src/globals.js`.
- Migration plan: Upgrade `three` in one step, then fix the addon imports and `ExtrudeBufferGeometry` usage. Compare the sample render before and after.

**`geolib` 3.x (`package.json`):**
- Risk: Used only for distance and bearing. Its functions take `[lon, lat]` or `{latitude, longitude}` objects. Passing a flat number (as the wrong-geometry paths can) throws inside it.
- Impact: Bad input in `src/city.js` surfaces as an opaque `geolib` error.
- Migration plan: Keep `geolib` if the projection is kept. A short local haversine helper would remove the dependency, but this is optional.

## Missing Critical Features

**No error reporting for the user:**
- Problem: A failed load shows a blank canvas. There is no message, no retry, and no check of the HTTP status.
- Blocks: Diagnosing a wrong data URL without opening the console.

**No way to switch layers on or off:**
- Problem: The `setup()` and `start()` flags do nothing (see Tech Debt).
- Blocks: Showing only roads or only buildings for a demo.

**No way to load a saved path except through the config URL:**
- Problem: `S` downloads `path.json`, but the page has no import control. The developer must copy the file into the host app and set `config.path`.
- Blocks: Iterating on a path in the browser without a rebuild.

## Test Coverage Gaps

**No tests at all:**
- What's not tested: The whole package. `package.json` `test` script prints an error and exits 1.
- Files: `package.json`
- Risk: Any change to the projection, the GeoJSON parser, or the path logic breaks silently.
- Priority: High

**Pure functions could be tested without a browser:**
- What's not tested: `normalizeCoordinates()` and `generateRoad()` in `src/city.js`, `savePath()` logic (the array-to-JSON step) and the bounds behaviour of `addPoint()` in `src/path.js`, and `scalePercent()` and `updateLine()` index math in `src/animate.js`.
- Files: `src/city.js`, `src/path.js`, `src/animate.js`
- Risk: The projection and index bugs described above recur after any refactor.
- Priority: High. Extract the pure functions into a module that Node can import, then cover them with a small `node --test` suite.

**Geometry parsing for each GeoJSON type:**
- What's not tested: `create3dObjects` with `Polygon`, `MultiPolygon`, `LineString`, and `Point` inputs.
- Files: `src/city.js`
- Risk: Silent wrong output or a thrown error on real Overpass exports.
- Priority: Medium. Use `sample/small.geojson` as the fixture.

**Interactive path drawing and scroll animation:**
- What's not tested: Click handling, drag detection, undo and redo, reset, and the scroll-to-camera mapping.
- Files: `src/path.js`, `src/animate.js`
- Risk: Regressions in the authoring flow are only found by hand.
- Priority: Low to medium. A browser test with a fixed viewport and a fixed path would cover it.

---

*Concerns audit: 2026-11-02*
