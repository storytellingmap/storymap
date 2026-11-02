---
last_mapped_commit: 29755b9a527ac50aa8e3f7ee73bc365a2e92da7d
last_mapped_at: 2026-11-02
---
<!-- refreshed: 2026-11-02 -->
# Architecture

**Analysis Date:** 2026-11-02

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                  Public API  (`index.js`)                    │
│          setup()    start()    global (config + state)       │
└───────────┬─────────────────────┬────────────────────┬──────┘
            │                     │                    │
            ▼                     ▼                    ▼
┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│  Scene bootstrap │  │  City generation     │  │  Path authoring  │
│ `src/initialize.js`│ │  `src/city.js`       │  │  `src/path.js`   │
│  scene, camera,  │  │  GeoJSON → meshes    │  │  click-to-draw   │
│  renderer, loop  │  │                      │  │  line, save JSON │
└────────┬─────────┘  └──────────┬───────────┘  └────────┬─────────┘
         │                       │                       │
         │      ┌────────────────┴───────────────┐       │
         │      ▼                                 ▼       │
         │  ┌──────────────────────────────────────────┐  │
         └─▶│  Shared mutable singleton `GLOBAL`        │◀─┘
            │  `src/globals.js`                         │
            └──────────────────────────────────────────┘
                              ▲
                              │
            ┌─────────────────┴──────────────────────┐
            │  Path playback  `src/animate.js`        │
            │  scroll-driven camera + line draw-range │
            └────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Public API | Orchestrates the start-up order and exports `setup`, `start`, `global` | `index.js` |
| Global store | Holds the three.js scene, camera, renderer, config defaults, shared arrays, and materials | `src/globals.js` |
| Scene bootstrap | Builds scene, camera, lights, renderer, resize handler, debug helpers, and the render loop | `src/initialize.js` |
| City generator | Fetches GeoJSON, converts lat/lon to local x/z, extrudes buildings, lines roads, fills water and green, merges meshes | `src/city.js` |
| Path authoring | Adds a raycast marker, click-to-add points, undo/redo/reset keys, and downloads `path.json` | `src/path.js` |
| Path playback | Fetches `path.json`, builds a draw-range line and a CatmullRom spline, drives camera from scroll position | `src/animate.js` |
| Sample data | Bruges GeoJSON extract and a recorded camera path | `sample/bruges.geojson`, `sample/small.geojson`, `sample/path.json` |

## Pattern Overview

**Overall:** Single-package browser library with a module-level singleton state object and a two-mode (author / play) runtime. No build step lives in the repo. Consumers bundle it with Vite.

**Key Characteristics:**
- One mutable global object (`GLOBAL`, exported as `global`) carries all runtime state. Every module imports it as `$`.
- Two runtime modes selected by the caller: `setup()` (author a path) and `start()` (play a saved path).
- Imperative three.js code. No framework, no component tree, no reactivity.
- Configuration is supplied by assigning `global.config` before calling `setup()` or `start()`. The defaults in `src/globals.js` are overwritten.
- Module dependency graph is a star. Each `src/*.js` module depends on `src/globals.js`. No `src/*.js` module imports another `src/*.js` module, except `index.js` and `src/initialize.js`, which is imported only by `index.js`. No circular imports exist.
- The repo ships no tests. The `test` script in `package.json` is a placeholder.

## Layers

**Public API layer:**
- Purpose: Start-up sequencing and the package entry point.
- Location: `index.js`
- Contains: `setup`, `start`, and re-export of `global`.
- Depends on: `src/globals.js`, `src/initialize.js`, `src/city.js`, `src/path.js`, `src/animate.js`
- Used by: Consumer application (for example, a Vite `main.js` as shown in `README.md`).

**State layer:**
- Purpose: Single source of shared runtime state and defaults.
- Location: `src/globals.js`
- Contains: `GLOBAL` object with scene handles, config defaults, geometry arrays, line buffers, and materials. Materials and vectors are constructed at import time.
- Depends on: `three`, `three/examples/jsm/lines/LineMaterial` (imported but unused)
- Used by: All other `src/*.js` modules.

**Rendering layer:**
- Purpose: Scene graph, camera, lights, renderer, and per-frame render.
- Location: `src/initialize.js`
- Contains: `initialize()`, `resize()`, `animate()`.
- Depends on: `src/globals.js`, `three`, `three/examples/jsm/controls/OrbitControls`, `three/examples/jsm/libs/stats.module`
- Used by: `index.js` only.

**Data-to-geometry layer:**
- Purpose: Convert OSM GeoJSON features into extruded or line geometry, merged per category.
- Location: `src/city.js`
- Contains: `generateCity()` (exported), `create3dObjects()`, `generateBuilding/Road/Water/Green()`, `generateShape()`, `generateGeometry()`, `spawn*()` functions, `normalizeCoordinates()`.
- Depends on: `src/globals.js`, `three`, `geolib`, `three/examples/jsm/utils/BufferGeometryUtils`
- Used by: `index.js` (both `setup` and `start`).

**Authoring layer:**
- Purpose: Interactive drawing of a camera path on the city.
- Location: `src/path.js`
- Contains: `generatePath()` (exported), raycast marker, mouse and keyboard handlers, `savePath()`.
- Depends on: `src/globals.js`, `three`, `geolib` (imported, unused)
- Used by: `index.js` `setup()` only.

**Playback layer:**
- Purpose: Load a saved path, draw it progressively, and move the camera with scroll.
- Location: `src/animate.js`
- Contains: `animatePath()` (exported), `loadPath()`, `drawSpline()`, `drawLine()`, `initializeEventListeners()`, `playScrollAnimations()`, and the `animationScripts` table.
- Depends on: `src/globals.js`, `three`
- Used by: `index.js` `start()` only.

## Data Flow

### Primary Request Path (author mode, `setup()`)

1. Consumer sets `global.config` and calls `setup()` (`index.js`).
2. `initialize()` builds scene, camera, lights, renderer, and attaches to `#<config.container>` (`src/initialize.js`).
3. `animate()` starts the `requestAnimationFrame` render loop (`src/initialize.js`).
4. `generateCity()` fetches `config.data`, converts each feature, and calls `spawnBuildings/Roads/Water/Green/Ground` (`src/city.js`).
5. `generatePath()` adds the marker, mouse and key listeners, and an empty `USERPATH` line (`src/path.js`).
6. User clicks on the city. `castRay()` sets `$.hit` and `$.mouseposition`. `addPoint()` writes into `$.lineArray` (`src/path.js`).
7. Key `s` calls `savePath()`, which downloads `path.json` as `[[x,y,z], ...]` (`src/path.js`).

### Primary Request Path (playback mode, `start()`)

1. Consumer sets `global.config` and calls `start()` (`index.js`).
2. `initialize()` and `animate()` run as in author mode (`src/initialize.js`).
3. `generateCity(config)` builds the city. The config argument is ignored (`src/city.js`).
4. `animatePath()` fetches `config.path`, fills `$.lineArray` and `$.lineArrayBackup`, builds a `CatmullRomCurve3` in `$.cameraPath`, and draws the `$.line` (`src/animate.js`).
5. `initializeEventListeners()` registers a `scroll` listener that writes `$.scrollpercentage` (`src/animate.js`).
6. The separate `animate()` loop in `src/animate.js` calls `playScrollAnimations()`. Each entry in `animationScripts` runs when `start <= scrollpercentage < end`. The only active entry (1 to 101) moves the draw range and the camera (`src/animate.js`).

### City Feature Dispatch

1. `loadGeoJsonAsync()` returns `data.features` (`src/city.js`).
2. `create3dObjects()` routes each feature by property, in this order: `building` → `buildingArray`; `highway` (non-Point) → `roadArray`; `natural` → `waterArray`; `leisure` → `greenArray` (`src/city.js`).
3. `spawnX()` calls `mergeBufferGeometries()` for buildings, water, and green. It adds one mesh per category to the scene. Roads add one `THREE.Line` per road (`src/city.js`).

**State Management:**
- All state lives on `GLOBAL` (`src/globals.js`). Modules write to it directly.
- Scroll position is `$.scrollpercentage`, written by a `scroll` listener and read by the animation loop.
- Path points live in `$.lineArray` (Float32, 3 values per point). `$.lineClickCounter` is the point count. `$.lineClickMax` is the redo ceiling.

## Key Abstractions

**`GLOBAL` singleton:**
- Purpose: Shared runtime state and config defaults.
- Examples: `src/globals.js`
- Pattern: Exported mutable object. Consumers may override `config` before calling `setup()` or `start()`. It is also exposed as `global` from `index.js`.

**Config object:**
- Purpose: Per-deployment settings (data URLs, container id, city center, colors, debug flag).
- Examples: `src/globals.js` (defaults), `README.md` (documented override)
- Pattern: Plain object. Read at call time, not captured at import time, so late assignment works.

**Feature-to-geometry generators:**
- Purpose: One function per OSM category that returns a `THREE.BufferGeometry`.
- Examples: `generateBuilding`, `generateRoad`, `generateWater`, `generateGreen` in `src/city.js`
- Pattern: Polygon categories build a `THREE.Shape` (outer ring plus holes) and extrude it through `generateGeometry()`. Road geometry is a flat `BufferGeometry` of line vertices.

**Path (ordered point list):**
- Purpose: The camera route, shared between author and playback modes.
- Examples: `sample/path.json`, `$.lineArray` in `src/path.js`
- Pattern: Flat `Float32Array` for the draw line. Saved and loaded as a nested JSON array of `[x, y, z]`.

**Animation script table:**
- Purpose: Map scroll ranges to frame-by-frame actions.
- Examples: `animationScripts` in `src/animate.js`
- Pattern: Array of `{ start, end, func }` evaluated every frame. Commented-out camera scripts show the intended extension point.

**Coordinate normalization:**
- Purpose: Convert lat/lon to local planar x/z around `config.citycenter`.
- Examples: `normalizeCoordinates()` in `src/city.js`
- Pattern: Uses `geolib` distance and rhumb bearing, then scales by 1/100. The x axis is negated. Output is `[x, z]` pairs.

## Entry Points

**Package entry (`index.js`):**
- Location: `index.js` (`package.json` `main` field)
- Triggers: Consumer `import * as storymaps from "storymap"`.
- Responsibilities: Exports `setup`, `start`, and `global`.

**`setup(config)`:**
- Location: `index.js`
- Triggers: Consumer call, typically from `main.js` in the consumer app.
- Responsibilities: Author mode. Calls `initialize()`, `animate()`, `generateCity(...)`, `generatePath()`. The `config` argument is read for its keys, but the values are passed as four positional booleans to `generateCity`, which accepts one object. The flags have no effect.

**`start(config)`:**
- Location: `index.js`
- Triggers: Consumer call after a path has been saved.
- Responsibilities: Playback mode. Calls `initialize()`, `animate()`, `generateCity(config)`, `animatePath()`.

**Scroll render loop:**
- Location: `src/animate.js` (`animate()`)
- Triggers: `requestAnimationFrame` after `animatePath()`.
- Responsibilities: Evaluate `animationScripts` each frame.

**Render loop:**
- Location: `src/initialize.js` (`animate()`)
- Triggers: `requestAnimationFrame` from `index.js`.
- Responsibilities: Render the scene. In debug mode, update stats and orbit controls.

## Architectural Constraints

- **Threading:** Single-threaded browser main thread. Work is `fetch` plus synchronous geometry build. No workers.
- **Global state:** `src/globals.js` exports `GLOBAL`. Every `src/*.js` module mutates it. `src/path.js` and `src/animate.js` both assign `$.line`, `$.lineArray`, and `$.lineArrayBackup`.
- **Module-level state:** `src/path.js` holds `sphereMarker`. `src/animate.js` holds `animationScripts`, `LINEPOINTCOUNT`, `DRAWRANGE`, `X`. `DRAWRANGE` and `X` are unused.
- **Implicit DOM global:** `src/initialize.js` uses a bare `container` identifier (lines 9, 10, 53, 71, 95, 96). It resolves to the element with id `container` through the browser's named-access rule. It does not come from `$.container` or `$.config.container`.
- **Implicit event global:** `src/path.js` `castRay()` reads a bare `event` (lines 125, 126). It takes no parameter. It relies on `window.event`.
- **Circular imports:** None.
- **Build:** The package ships untransformed ES modules. The consumer bundler must resolve `three/examples/jsm/...` and `geolib`.
- **Dependency versions:** `three` is pinned to `^0.137.5`. Example paths under `three/examples/jsm/` depend on that release layout.

## Anti-Patterns

### Positional arguments to an object-taking function

**What happens:** `setup()` in `index.js` calls `generateCity(config.buildings, config.roads, config.water, config.green)`. `generateCity` takes a single `config` object (`src/city.js` line 270).
**Why it's wrong:** The four flags never reach `generateCity`. The per-category flags have no effect. The commented-out gates in `src/city.js` (lines 287 to 298) would need to be restored to make them work.
**Do this instead:** Pass the object: `generateCity(config)`, and restore the gates in `generateCity` to read `config.buildings`, `config.roads`, and so on.

### Bare DOM id as a variable

**What happens:** `src/initialize.js` reads `container.clientWidth` and `container.appendChild(...)` without declaring `container`. The code ignores `$.container`, which is set a line earlier.
**Why it's wrong:** The lookup only works because the browser exposes elements by id on `window`. It breaks if `config.container` is not `"container"`. It also breaks when the element is absent, because the reference throws.
**Do this instead:** Use `$.container` everywhere in `src/initialize.js`, including `resize()`.

### Ambient `event` in a handler helper

**What happens:** `castRay()` in `src/path.js` reads `event.clientX`. The function has no `event` parameter. `onMouseMove(event)` is defined but commented out in the listener list.
**Why it's wrong:** `window.event` is non-standard in its scope rules and fragile across browsers. The mousemove listener passes no event.
**Do this instead:** Pass the event: `document.addEventListener("mousemove", (e) => castRay(e))`, and read `e.clientX` and `e.clientY` in `castRay(e)`.

### Dead code that still references undefined identifiers

**What happens:** `drawTube()` in `src/animate.js` (line 104) references `shape`, which is never defined. `moveCameraToStart()` (line 256) references `location`. `cameraFollowCurve()` (line 266) calls `$.camera.position.set(camPos)` with a Vector3 argument.
**Why it's wrong:** These functions are not called today. A call would throw `ReferenceError` or set the position to `NaN`.
**Do this instead:** Delete unused functions, or keep them behind a clear `// shortcut:` comment with the required inputs. Do not call them until they are fixed.

### Camera target passed as an array

**What happens:** `src/initialize.js` line 25 calls `$.camera.lookAt($.cameraLookStartPos)`. `cameraLookStartPos` is a plain array `[13, 0, 6]` (`src/globals.js` line 12).
**Why it's wrong:** three.js `lookAt` expects an object with `x`, `y`, `z`. An array yields `NaN` for the target. The first frame may look in an undefined direction.
**Do this instead:** Use the `THREE.Vector3` already defined as `cameraLookAtPos` in `src/globals.js`, or build one from the array.

### Mutable state shared across two modes

**What happens:** Author mode writes the user path into `$.lineArray` and `$.line` through `src/path.js`. Playback mode overwrites the same fields in `src/animate.js` and mutates `$.lineArray` during scroll.
**Why it's wrong:** Calling `setup()` and `start()` in the same page leaves both modules writing into the same buffers. Their behaviour depends on call order.
**Do this instead:** Run one mode per page load. If both are needed, give each mode its own state object instead of `GLOBAL`.

## Error Handling

**Strategy:** Minimal. No `try`/`catch` exists in `src`. `fetch` errors and JSON parse errors reject the async function and are not caught.

**Patterns:**
- `loadGeoJsonAsync()` and `loadPath()` return promises without a catch. The caller `generateCity` and `animatePath` do not handle rejection.
- `spawnBuildings()` calls `mergeBufferGeometries($.buildingArray)`. If the array is empty, the merge returns `null`, and `new THREE.Mesh(null, ...)` fails later. No guard exists.
- `create3dObjects` guards roads with `generateRoad(...) != undefined`. Other categories have no such guard.

## Cross-Cutting Concerns

**Logging:** `console.log` lines are commented out throughout. No logger is used.

**Validation:** None on GeoJSON or path JSON. Input is trusted to match the expected shape (Polygon rings for building, water, and green; LineString for roads; array of `[x,y,z]` for path).

**Authentication:** Not applicable. The package is client-side only and makes no authenticated calls.

**Debug mode:** `config.debug` (default `true` in `src/globals.js`) toggles axes, the FPS counter, and orbit controls in `src/initialize.js`. The `README.md` example sets it to `true`. Controls are only created in debug mode, but `src/initialize.js` `animate()` calls `$.controls.update()` only in debug mode. The two are consistent. Playback and author flows both depend on debug-mode objects only through that guard.

---

*Architecture analysis: 2026-11-02*
