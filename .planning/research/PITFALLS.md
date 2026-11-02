# Pitfalls Research

**Domain:** Revive-and-upgrade of a 2022 browser 3D story-map library (three.js r137 city from OpenStreetMap GeoJSON, drawn path, scroll-driven camera)
**Researched:** 2026-11-02
**Confidence:** HIGH for items marked "verified locally"; MEDIUM for lighting appearance; LOW for items that rest only on web search

Evidence key used below:
- **Verified locally**: checked on 2026-11-02 against the npm tarballs of `three@0.187.0`, `geolib@4.0.1`, `geolib@3.3.4`, `geolib@3.3.14`, `playwright-core@1.64.1`, or by a run in a scratch Vite 8.3.5 / npm 11.20.0 / Node 26.12.1 project. HIGH.
- **Official doc**: three.js Migration Guide, Chromium SwiftShader doc. The research seam rates web providers LOW; each such claim that matters was cross-checked against a tarball, which raises it to HIGH.
- **Web only**: forum threads or aggregators. LOW. Treat these as hints, not facts.

## Critical Pitfalls

### Pitfall 1: Treating issue #2 as a three.js upgrade problem

**What goes wrong:**
The `computeBoundingSphere(): Computed radius is NaN` error comes from the library's own GeoJSON parser and the sample data. It does not come from the old three.js version. A three.js upgrade alone does not fix it. The upgrade also hides the cause, because two changes land at once.

**Why it happens:**
`create3dObjects()` in `src/city.js` assumes `Polygon` for areas and `LineString` for roads. For other shapes it passes a ring (an array of points) to `normalizeCoordinates()` as if it were one point. `geolib` then returns `NaN` without an error. Verified locally on the Bruges sample:
- 1 `MultiPolygon` building sends whole rings into `generateShape()`. The merged `BUILDINGS` geometry then holds `NaN` positions.
- 4 road features (`Polygon` with more than one ring, or `MultiPolygon`) pass `coordinates.length > 1` and go into `generateRoad()`. Each one becomes a `THREE.Line` with `NaN` positions.
- `geolib` 3.3.4 and 4.0.1 both return `[NaN, NaN]` for a ring passed as a point. Neither throws.

`sample/small.geojson` has 0 such features. It does not reproduce the error.

**How to avoid:**
- Reproduce issue #2 on three r137 with `sample/bruges.geojson` first, before any dependency change.
- Normalise geometry types at the parser boundary. `MultiPolygon` becomes several `Polygon` entries. A road `Polygon` uses its outer ring as a `LineString`. `Point` features are skipped for every layer.
- Add a Node test that runs the parser on both samples and asserts that every output position is finite.

**Warning signs:**
- The error appears with Bruges and not with `small.geojson`.
- A few roads cannot be clicked in author mode. A `NaN` bounding sphere makes `Line.raycast` return no hits.

**Phase to address:**
Health check (reproduce), then the defect-fix phase (fix). Both come before the dependency refresh.

---

### Pitfall 2: Fixing the console error and declaring "the project starts"

**What goes wrong:**
The `NaN` message is a `console.error`. It does not stop rendering. The `BUILDINGS` mesh has `frustumCulled = false`, so it still draws. The outside user's "project not starting" can have another cause. Closing #2 after the `NaN` fix can leave the real failure in place.

**Why it happens:**
The screenshot in the issue shows only the error text. Other start-up failures in the code are silent:
- A `Point` feature tagged `natural` or `leisure` (for example `natural=tree`, common in real Overpass exports) sends a flat `[lon, lat]` to `generateWater()` or `generateGreen()`. `number.forEach` then throws a `TypeError`. The throw happens inside the un-awaited `generateCity()`. The result is a blank scene and an unhandled rejection.
- An export with tags nested under `properties.tags` (raw `osmtogeojson`, some GIS tools) matches no layer. `mergeGeometries([])` then throws on `geometries[0].index`. Verified locally in the three 0.187 source: the function has no empty-array guard.
- A host page with a container id other than `container` throws `ReferenceError` (the bare `container` identifier).
- A page that is not taller than the viewport gives `scrollpercentage = NaN`. The animation then never runs.

**How to avoid:**
- Define "starts" as an observable result: the canvas exists, the buildings, roads, water and green meshes exist with finite bounding spheres, and no `console.error` occurs. Use that result as the acceptance check for #2.
- Test with one real Overpass Turbo export that is not Bruges (it includes `Point` features with `natural` tags), and with one dataset that has no water.
- `await generateCity()` in `setup()` and `start()`, and show load errors in the container.

**Warning signs:**
- A blank canvas with no error on screen.
- "Uncaught (in promise)" in the console.

**Phase to address:**
Health check (record each failure separately), then the defect-fix phase. Ask the issue author for the dataset if the Bruges fix does not match the report.

---

### Pitfall 3: Upgrading three.js without a visual baseline from r137

**What goes wrong:**
After the upgrade the city looks different: darker, flatter, other shades. Nobody can say whether this is a regression, because no reference image of the 2022 look exists.

**Why it happens:**
Two default changes move the image without any API error:
- **Lighting (r155, Official doc).** `useLegacyLights` is `false` by default from r155. It is removed in 0.187 (verified locally: the name does not occur in the build). Ambient, hemisphere and directional intensities need a factor of about pi to keep the old look.
- **Point light decay (r147 + r155).** `PointLight.decay` defaults to `2`, and physical mode applies inverse-square falloff with no cutoff. `light1` is a `PointLight(0xffffff, 0.5)` at `(500, 1000, 500)`. That is about 1,225 scene units from a city that spans about 20 units. In r137 with `distance = 0`, that light had no falloff. In 0.187 its contribution falls to about 0.5 / 1.5 million, which is effectively zero. The buildings then get only ambient light, and every face has the same shade. The extruded city reads as a flat white silhouette. (Reasoning from the documented falloff rules, MEDIUM. Confirm with the screenshot comparison.)
- **Colour management (r152, Official doc).** `ColorManagement.enabled = true` and `outputColorSpace = SRGBColorSpace` by default. Hex colours on `MeshBasicMaterial` and `LineBasicMaterial` (ground, roads) round-trip unchanged. `MeshPhongMaterial` colours (buildings, water, green) are now lit in linear space, so mid-tones change.

**How to avoid:**
- In the health check, capture screenshots of `setup()` and of `start()` at 0 %, 50 % and 100 % scroll, on r137, with a fixed viewport and fixed `devicePixelRatio`. Commit them as the reference.
- Replace `light1` with a `DirectionalLight` (no distance falloff). Scale the ambient and directional intensities by `Math.PI`. Then compare with the reference.
- Do not try to restore legacy mode. The switch no longer exists.
- Keep the colour-management defaults. Do not set `ColorManagement.enabled = false` to "match 2022". That opts the library out of the current pipeline that consumers' other three.js code expects.

**Warning signs:**
- Building walls and roofs have the same brightness.
- Water and green areas look washed out or too saturated compared with the reference.

**Phase to address:**
Health check (baseline), then the dependency-refresh phase (lighting change plus screenshot comparison).

---

### Pitfall 4: A "projection cleanup" that silently invalidates `sample/path.json`

**What goes wrong:**
Someone tidies `normalizeCoordinates()`. The saved path then no longer lies on the roads, and the camera start constants point at the wrong place. Nothing throws. The line simply floats beside the streets.

**Why it happens:**
The current projection has three quirks that look like bugs, and each one is part of the saved data:
- It adds the raw `citycenter` degrees as metres. The constant offset is `(3.227 m, 51.21 m)`, which is about `(0.032, 0.512)` scene units after `/100`. Removing it moves the whole city about 51 m against `path.json`.
- `getDistance()` rounds to whole metres (`accuracy = 1` by default in both `geolib` 3 and 4, verified locally). A switch to `getPreciseDistance()` or `accuracy = 0` moves every vertex by up to 0.5 m.
- It uses the bearing from the feature to the centre, with `cos` on the x axis and a sign flip ("Reverse X (it work)"), plus `rotateZ(Math.PI)` and `rotateX` on the meshes. Any change to one of these mirrors or rotates the city.

`path.json` stores scene coordinates (61 points), not lon/lat. It has no record of the projection that made it.

**How to avoid:**
- Keep `normalizeCoordinates()` byte-for-byte in v1.1. A projection redesign is v2.x work, and it changes the path file format in the same change (store lon/lat, or store the projection parameters).
- Add a Node invariant test: every point in `sample/path.json` lies within `0.001` scene units of a projected Bruges road segment. Verified locally: today the worst distance is `4.2e-7` units. Moving the 51 m offset would make it about `0.5`. This one test detects every kind of drift, whatever its cause.
- Add a golden test: `normalizeCoordinates()` on a few fixed lon/lat pairs equals stored values to `1e-9`.

**Warning signs:**
- The drawn line is beside the roads in reader mode.
- The camera starts away from the path start.
- Someone proposes "remove the `+ centerPosition` terms" or "use the precise distance".

**Phase to address:**
Test-harness phase (the invariant test lands before any refactor). It then guards the defect-fix and dependency-refresh phases.

---

### Pitfall 5: Two copies of three.js in the consumer

**What goes wrong:**
The consumer installs a current `three` for its own code. `storymap` declares `three: ^0.137.5` as a regular dependency. npm nests a second copy. The bundle then carries both, and objects from one copy fail `instanceof` checks in the other.

**Why it happens:**
Verified locally: a fresh Vite 8.3.5 app with `three@0.187.0` plus `npm i https://github.com/storytellingmap/storymap` gives `node_modules/storymap/node_modules/three@0.137.5`. The build succeeds at 583 kB, which is both copies. A caret range on a `0.x` version allows only patch updates, so `^0.137.5` never reaches a current release. `npm link` in a dev setup has the same effect: the linked repo resolves its own `node_modules/three`.

**How to avoid:**
- Move `three` to `peerDependencies` with a tested floor (the release the refresh is tested on). Keep an exact `three` version in `devDependencies` for tests.
- Document `resolve.dedupe: ['three']` in `INSTALLATION.md` for `npm link` setups.
- In the health check, run `npm ls three` in the consumer and record the result.

**Warning signs:**
- `npm ls three` shows two versions.
- The console shows "WARNING: Multiple instances of Three.js being imported."
- A consumer's `Vector3` passed into the library behaves oddly.

**Phase to address:**
Dependency-refresh phase. The health check records the current state.

---

### Pitfall 6: Old addon import paths and renamed APIs that fail only at build or run time

**What goes wrong:**
After the version bump, the build fails, or the page throws at import time.

**Why it happens:**
Verified locally against `three@0.187.0`:
- `ExtrudeBufferGeometry` does not exist. Use `ExtrudeGeometry`. The alias was deprecated in r145 and is now removed.
- `mergeBufferGeometries` does not exist in `BufferGeometryUtils`. Use `mergeGeometries` (renamed in r151). It returns `null` for incompatible attributes, and it throws on an empty array.
- `MapControls` is no longer exported from `controls/OrbitControls.js`. It moved to `controls/MapControls.js` in r151. `src/initialize.js` imports it from `OrbitControls` and breaks.
- `libs/stats.module.js` still has a default export. `lines/LineMaterial.js` still exists, but `src/globals.js` imports it and never uses it. Delete the import.
- `three` has an `exports` map with `./examples/jsm/*` and `./addons/*`. Vite 8 resolves extensionless subpaths such as `three/examples/jsm/controls/OrbitControls` (verified locally: the build passes). Node ESM does not (verified locally: `ERR_MODULE_NOT_FOUND`).

**How to avoid:**
- Rewrite every addon import to `three/addons/<path>.js` with an explicit `.js` extension.
- Rename `ExtrudeBufferGeometry` and `mergeBufferGeometries`, and import `MapControls` from its own file.
- Guard every merge: skip the layer when the array is empty, and check for `null`.
- Upgrade in one jump to the target release. Then grep the Migration Guide entries r138 to r187 for every three.js symbol the code uses. Intermediate steps add no safety, because the sample-based tests are the check.

**Warning signs:**
- `"MapControls" is not exported by ".../OrbitControls.js"` in the Vite build.
- `mergeGeometries() failed with geometry at index N` in the console.

**Phase to address:**
Dependency-refresh phase.

---

### Pitfall 7: Writing Node tests against source that Node cannot import

**What goes wrong:**
The new `npm test` (`node --test`) cannot load `src/city.js`. The test step either fails for the wrong reason, or someone adds a bundler or a TypeScript loader just to run tests.

**Why it happens:**
Verified locally: `import("storymap/src/city.js")` fails under Node 26 with `ERR_MODULE_NOT_FOUND` for `src/globals`. Every relative import in `index.js` and `src/*.js` has no extension (`"./src/globals"`). Vite tolerates this, and Node ESM does not. `package.json` also has no `"type": "module"`. Node 26 detects ESM syntax, but it prints a warning on each run. The pure functions (`normalizeCoordinates`, `generateRoad`, the scroll index math) are also not exported.

**How to avoid:**
- Add `.js` to every relative import, and add `"type": "module"` to `package.json`. Vite accepts both changes, and Node then runs the source directly. No build step and no test framework are needed.
- Export the pure functions from their modules (not from `index.js`, so the public API stays the same).
- Keep module top levels free of `window` and `document` access, so Node can import them. Today `src/globals.js` creates materials at import time, which works in Node.

**Warning signs:**
- A proposal to add Jest, Vitest or a bundler only to run the first unit test.

**Phase to address:**
Test-harness phase.

---

### Pitfall 8: A headless WebGL test that passes with no WebGL, or fails only in CI

**What goes wrong:**
The browser smoke test is green on a Mac and red on a Linux CI runner, or the reverse. Or it passes while WebGL context creation failed, because the test checks only that the page loaded.

**Why it happens:**
- CI runners have no GPU. Chromium no longer falls back to SwiftShader silently. WebGL context creation fails unless `--enable-unsafe-swiftshader` is set (Chromium SwiftShader doc; the deprecation started in Chrome 130, with removal around Chrome 137 to 139, LOW on the exact version). Verified locally: Playwright 1.64.1 adds `--enable-unsafe-swiftshader` to its Chromium launch. A hand-made Puppeteer or raw headless-Chrome setup must add it itself, and `--disable-gpu` must not be set (LOW, web only).
- Pixel screenshots differ between macOS (Metal through ANGLE) and Linux (SwiftShader). Baselines made on a Mac fail in CI.
- Software rendering of the full Bruges sample (about 21,400 buildings) is slow. Parsing and triangulation run on the main thread before the first frame.

**How to avoid:**
- Use Playwright with its bundled Chromium. Do not hand-roll launch flags.
- Assert scene state, not pixels, in CI. `index.js` already exports `global`, so the test can read `storymaps.global.scene`, `global.camera.position` and `global.renderer.info.render.triangles` with no new API. Required results: a WebGL2 context exists, the named meshes exist with finite bounding spheres, the triangle count is above a floor, no `console.error` occurs, and the camera position is finite after scrolls to 0 %, 50 % and 100 %.
- Use `sample/small.geojson` in CI. Run the Bruges sample in the health check and in one slower job.
- If pixel comparison is wanted, create the baselines in the same Linux container that CI uses.

**Warning signs:**
- "Error creating WebGL context" in the test log.
- A test that passes in less time than the GeoJSON load takes.

**Phase to address:**
Test-harness phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Filter `MultiPolygon` and `Point` features out of the data instead of handling them in the parser | Issue #2 disappears for Bruges | Every real Overpass export breaks again | Never. Normalise types in the parser. |
| Set `ColorManagement.enabled = false` to match the 2022 colours | Fast visual match | Conflicts with consumer scenes. The API may be removed later. | Never |
| Keep `three` as a regular dependency | No consumer change | Two three.js copies, and the caret on 0.x pins the minor | Never for a three.js library |
| Raise the 600-point buffer to a large fixed size, for example 10,000 points | One-line fix, 120 kB of memory | A hard limit still exists | Acceptable in v1.1 if the author sees the limit on screen. A three.js `BufferAttribute` cannot grow in place. Growth needs a new attribute or geometry. |
| Keep the global `GLOBAL` singleton in v1.1 | `setup()`, `start()` and `global` stay compatible | No `dispose()`, and tests cannot run two scenes | Acceptable until the v2.1 API work |
| Pixel-diff tests as the only browser check | Catch visual drift | Flaky across operating systems and GPUs | Only with baselines made in the CI container, and next to state assertions |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| npm install from a GitHub URL | Add a build step and rely on a `prepare` script | Ship ready-to-run ESM source. npm 11.20 blocks `prepare` for non-registry sources by default unless the consumer approves it (`allowScripts`). Verified locally from `npm help install-scripts`. |
| npm install from a GitHub URL | Expect `npm update` to pull new commits | The lockfile pins a commit (`git+ssh://...#29755b9`, verified locally). Consumers re-install the package to move. Tag releases and document `github:storytellingmap/storymap#v1.1.0`. |
| npm install from a GitHub URL in CI | Assume the `git+ssh` URL in the lockfile works without SSH keys | Test the consumer install in CI once (LOW: this was not tested without keys). Use the `github:` shorthand or the HTTPS URL in docs. |
| Old repo URL `elfensky/storymap` | Keep it in docs because the redirect works | Use `storytellingmap/storymap`. A GitHub redirect breaks when someone creates a repo with the old name. The v2.0 monorepo move changes the URL again. |
| Overpass Turbo export | Assume all exporters flatten tags into `properties` | Overpass Turbo flattens them (the sample has `@id` plus flat tags). Raw `osmtogeojson` and other tools nest them under `properties.tags`. Detect the shape and fail with a clear message. |
| OSM `building:levels` | Multiply the raw tag value | Values such as `"3;4"`, `"2,5"` and `"3+"` occur in OSM and give `NaN` extrude depth. Parse with `parseFloat`, and fall back to `1` when the result is not finite and positive. The Bruges sample has no such values (verified locally). |
| `geolib` 3 to 4 | Expect projection drift | Verified locally: 4.0.1 differs from 3.3.4 by at most `3.5e-11` scene units over 17,633 road points, and by 0 from 3.3.14. The breaking changes are the removed default export and the removed deep imports. `import * as GEOLIB from "geolib"` keeps working. |
| Vite consumer | Blame Vite for extensionless `three/examples/jsm/...` imports | Vite 8 resolves them. The real break is `MapControls`. Node is the strict consumer. |
| `engines` field | Set `"node": ">=26"` because the toolchain runs on Node 26 | The library is browser-only. Put Node 26 in `.node-version` or mise and in CI. Leave `engines` out, or keep a low floor, so consumers on Node 22 or 24 get no `EBADENGINE` warnings. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full Bruges sample in every CI run | Slow or timed-out browser jobs under SwiftShader | `small.geojson` (1,805 buildings) in CI, Bruges in one slower job | About 21,400 buildings under software rendering |
| Raycast against the whole scene on every `mousemove` | Author mode lags on large cities | Keep the layer-1 filter. Intersect only the road objects and reuse one `Raycaster`. | Thousands of road `Line` objects, already in Bruges (3,708 roads) |
| Debug mode on by default (`Stats`, `MapControls`, `AxesHelper`) | Controls fight the scroll camera, and the frame cost rises | Default `debug` to `false` and disable controls in `start()` | Every reader-mode page |
| `devicePixelRatio` used without a cap | Heavy fill cost on 3x phone screens | Out of scope for v1.1 (`ANSWERS.md` rejects adaptive resolution). Record it only. | High-DPI mobile |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Load `config.data` and `config.path` without a shape check | A malformed file throws, or puts `NaN` into the scene | Validate a FeatureCollection, and a path that is an array of finite `[x, y, z]` triples. Check `response.ok`. |
| Keyboard shortcuts on any `keyup` | `S` in a host-page input starts a file download | Ignore events from `input`, `textarea` and `contenteditable` targets |
| `--enable-unsafe-swiftshader` outside tests | The flag is meant for trusted content only | Use it only in the test browser. Never document it for readers. |
| Install a dependency from a GitHub URL with all scripts allowed | Any future commit runs code on install | The library needs no install scripts. Do not tell consumers to run `npm install-scripts approve --all`. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent 600-point limit | The author's path is cut or saved with `null` entries | Show the point count and the limit. Stop adding points at the limit. |
| Blank canvas on any load error | The author cannot see why nothing renders | Show the error text in the container |
| Help text says `Z` resets | The author loses work by pressing `Z` (undo) | Fix `INSTALLATION.md`: `R` resets, `Z` undoes, `X` redoes |
| Scroll animation needs a page taller than the viewport, without saying so | Reader mode shows no motion | Document the need, and guard against the divide by zero |

## "Looks Done But Isn't" Checklist

- [ ] **Issue #2 fix:** often checked only with `small.geojson`, which has no `MultiPolygon`. Verify with `bruges.geojson`, and verify that no `console.error` occurs.
- [ ] **"Project starts":** often checked only by eye on the developer's Mac. Verify with the scene-state assertions in headless CI, and with a dataset that has `Point` features tagged `natural`.
- [ ] **three.js upgrade:** often marked done when the build passes. Verify the screenshots against the r137 baseline, and that `MapControls` works in debug mode.
- [ ] **Layer flags fix:** often re-enables the flags but leaves `setup()` passing four positional booleans. Verify both entry points with one disabled layer, and that the disabled layer is never merged.
- [ ] **Empty-layer data:** verify a dataset with no water. `mergeGeometries([])` throws.
- [ ] **Dependency refresh:** verify `npm ls three` in a fresh consumer shows exactly one version.
- [ ] **Saved path:** verify the path-on-road invariant test still passes after every change to `src/city.js`.
- [ ] **Scroll clamp:** verify the camera position is finite at 0 % and 100 % scroll, not only at 50 %.
- [ ] **Docs:** verify every command in `INSTALLATION.md` by running it in a fresh Vite project. The health check does this once, and the docs phase does it again after the edits.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Projection changed and `path.json` is off the roads | MEDIUM | Revert the projection change, or re-record the path in author mode on Bruges in the same commit. Update the camera constants in `src/globals.js`. |
| No r137 baseline before the upgrade | LOW | Install `three@0.137.5` in a scratch consumer (the GitHub install still resolves it) and capture the screenshots after the fact |
| Two three.js copies in the consumer | LOW | Move `three` to `peerDependencies`, then re-install in the consumer |
| City too dark after the upgrade | LOW | Replace the far `PointLight` with a `DirectionalLight`. Scale the intensities by pi and compare with the baseline. |
| CI cannot create a WebGL context | LOW | Switch to Playwright's bundled Chromium and remove any `--disable-gpu` flag |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Issue #2 misattributed to three.js | Health check, then defect fixes (both on r137) | Node test: all parsed positions finite on both samples |
| 2. "Starts" defined only as "no NaN error" | Health check, then defect fixes | Browser smoke test: meshes exist, no `console.error`; a dataset with `Point` features tagged `natural`; a dataset with no water |
| 3. No visual baseline | Health check (capture), then dependency refresh (compare) | Committed r137 screenshots, plus a side-by-side review after the upgrade |
| 4. Projection drift | Test harness (before any refactor) | Path-on-road invariant at most `0.001` units; golden `normalizeCoordinates()` values |
| 5. Two three.js copies | Dependency refresh | `npm ls three` in a fresh consumer shows one version |
| 6. Renamed APIs and moved addons | Dependency refresh | Vite build of a fresh consumer passes; debug mode loads `MapControls` |
| 7. Source not importable by Node | Test harness | `node --test` imports `src/*.js` with no loader |
| 8. Headless WebGL | Test harness | CI log shows a WebGL2 context; state assertions pass on Linux |

Recommended order inside v1.1: health check on r137 (baseline, reproduction) → test harness (Node invariants plus a browser smoke test) → defect fixes on r137 → dependency refresh (three, geolib, toolchain) → docs. This order means each three.js visual or behaviour change shows up against tests and a baseline that existed before it.

## Sources

- three.js Migration Guide, r138 to r187 entries: [github.com/mrdoob/three.js/wiki/Migration-Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) · [🔖 2026-11-02](https://linkding.lav.ren/bookmarks?details=4321). Rated LOW by the seam; each cited entry was cross-checked against the `three@0.187.0` tarball (HIGH).
- three.js forum, "Updates to lighting in three.js r155": [discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733](https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733) (LOW, search result only; supports the pi factor and the point-light decay change)
- Chromium, "Using Chromium with SwiftShader": [chromium.googlesource.com/.../docs/gpu/swiftshader.md](https://chromium.googlesource.com/chromium/src/+/205191a32c9db91062c5342e901b2da2d67a49e5/docs/gpu/swiftshader.md) (LOW, search result only), and blink-dev "Intent to Remove: SwiftShader Fallback": [groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM/m/oLrB5up_BwAJ](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM/m/oLrB5up_BwAJ) (LOW). The Playwright flag was verified locally in `playwright-core@1.64.1`.
- geolib 4.0.0 release summary: [newreleases.io/project/npm/geolib/release/4.0.0](https://newreleases.io/project/npm/geolib/release/4.0.0) (LOW, aggregator). The export layout and `getDistance` behaviour were verified locally in the `geolib@4.0.1` tarball and by the projection comparison run.
- three.js forum threads on Vite addon import errors: [discourse.threejs.org/t/import-import-orbitcontrols-not-work-what-is-wrong-help/47547](https://discourse.threejs.org/t/import-import-orbitcontrols-not-work-what-is-wrong-help/47547) (LOW). Superseded by the local Vite 8.3.5 build test.
- Local verification on 2026-11-02: tarballs `three@0.187.0`, `geolib@3.3.4`, `geolib@3.3.14`, `geolib@4.0.1`, `playwright-core@1.64.1`. A scratch Vite 8.3.5 consumer that installed `storymap` from GitHub (commit `29755b9`). Node 26.12.1 import tests. Feature-type counts, `NaN` road counts and the path-on-road distance, computed on `sample/bruges.geojson`, `sample/small.geojson` and `sample/path.json`.
- Repo context: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, GitHub issue storytellingmap/storymap#2.

---
*Pitfalls research for: revive-and-upgrade of a three.js r137 OpenStreetMap story-map library*
*Researched: 2026-11-02*
