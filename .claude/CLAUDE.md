<!-- GSD:project-start source:PROJECT.md -->

## Project

**storymap**

`storymap` is a browser JavaScript library for scroll-driven animated story maps. It builds a 3D city in three.js
from an OpenStreetMap GeoJSON export (Overpass Turbo), lets an author draw a path along the roads and save it as
JSON, and plays that path back on scroll: the line draws itself and the camera follows it. It began as Andrei's 2022
Bachelorproef (semester-7 research project); authors who want to tell a story along a route through a city are the
users, and Andrei is the only maintainer.

**Core Value:** An author can turn an OpenStreetMap extract and a drawn path into a scroll-driven 3D story that runs in a reader's
browser.

### Constraints

- **Tech stack**: plain JavaScript ES modules, browser-only, three.js and `geolib` — the existing code; Andrei's
  libraries use plain JavaScript with JSDoc, no TypeScript
- **Runtime**: dev toolchain and CI on the newest Node LTS line (Node 26); a published library keeps its own
  `engines` floor — Andrei's runtime rule (2026-10-24)
- **Order**: health check before any feature work — the code has not run since 2022 and an outside user reports it
  does not start
- **Compatibility**: keep `setup()`, `start()` and `global` working for existing consumers until the v2.1 API work —
  the demos depend on them
- **Data**: the Bruges sample and its saved path stay valid, or are regenerated in the same change — they are the
  only end-to-end fixture
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- JavaScript (ES modules, `import`/`export`, `async`/`await`) - all runtime code in `index.js` and `src/*.js`
- Markdown - documentation in `README.md`, `INSTALLATION.md`, `DOCS.md`, `SOURCES.md`, `ANSWERS.md`
- GeoJSON (OpenStreetMap export, produced by overpass-turbo) - map input data in `sample/bruges.geojson` and `sample/small.geojson`
- JSON - saved camera/line path data in `sample/path.json`, and `package.json`

## Runtime

- Browser only. The code calls `document`, `window`, `fetch`, `Blob`, `URL.createObjectURL` and WebGL through three.js. It has no Node.js entry point.
- No `.nvmrc`, `.node-version` or `engines` field is present. Node is needed only for the npm install and the Vite dev server described in `INSTALLATION.md`.
- Module type: `package.json` has no `"type": "module"` field. The files use ESM syntax and rely on the consuming bundler (Vite) to resolve them.
- npm (per `INSTALLATION.md`: `npm install https://github.com/elfensky/storymap`)
- Lockfile: missing from the repository. `package-lock.json` is listed in `.gitignore` (added in commit `62fc1b6`), so installed dependency versions are not pinned.

## Frameworks

- three.js `^0.137.5` - 3D scene, camera, renderer, meshes, lines, raycasting. Used in `src/initialize.js`, `src/city.js`, `src/path.js`, `src/animate.js`, `src/globals.js`.
- three.js example modules (imported from the same package):
- Not detected. `package.json` `scripts.test` is a placeholder that exits with an error. No test files exist.
- Vite - not a dependency of this package. `INSTALLATION.md` tells consuming projects to scaffold with `npm init vite@latest` and run `npm run dev`. The package itself has no build step.
- Prettier - configured in `.prettierrc` (4-space tab width, `useTabs: true`, `trailingComma: "all"`, `bracketSameLine: true`, `jsxSingleQuote: true`, `semi: true`). Prettier is not listed in `package.json`.
- Git attributes - `.gitattributes` sets `* text=auto` (LF normalization).

## Key Dependencies

- `three` `^0.137.5` (`package.json` `dependencies`) - the whole rendering layer. Version 0.137 is old. Some APIs used here are deprecated or removed in newer three.js releases:
- `geolib` `^3.3.3` (`package.json` `dependencies`) - geodesic calculations. `GEOLIB.getDistance` and `GEOLIB.getRhumbLineBearing` are used in `normalizeCoordinates` in `src/city.js` to convert lon/lat pairs into local x/z plane coordinates around `config.citycenter`. `src/path.js` imports `geolib` but does not call it.
- `three/examples/jsm/lines/LineMaterial` is imported in `src/globals.js` but not used.
- None beyond the two runtime dependencies above.
- `package.json` `name`: `storymap`, `version`: `1.0.0`, `main`: `index.js`, `license`: `UNLICENSED`.
- Repository: `git+https://github.com/elfensky/storymap.git`.

## Configuration

- No environment variables are read. No `process.env` usage exists in the source.
- Runtime configuration is a plain JavaScript object, `GLOBAL.config`, defined in `src/globals.js`. Consumers override it in their own `main.js` before calling `setup()` or `start()` (`README.md` § Configuration). Keys:
- `.env` files: none present.
- No build configuration in this repository. `.gitignore` excludes `node_modules`, `dist`, `dist-ssr`, `*.local`, `.DS_Store`, `package-lock.json`.
- `.prettierrc` - formatting rules (see Frameworks).
- `.gitattributes` - line-ending normalization.

## Platform Requirements

- Node.js and npm (version not pinned in the repository)
- A browser with WebGL support
- A local static file server or Vite dev server. The GeoJSON and path files are loaded with `fetch` from URLs, so they cannot be opened as `file://` URLs.
- Static hosting for the consuming site. The package has no server-side code. Data files are served from the same origin as the page, as `/node_modules/storymap/sample/...` by default.
- Published as an npm package installed from GitHub (`https://github.com/elfensky/storymap`). It is not published to the npm registry.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Lowercase single-word module names under `src/`: `src/globals.js`, `src/initialize.js`, `src/city.js`, `src/path.js`, `src/animate.js`.
- Package entry point at repo root: `index.js` (declared in `package.json` as `"main": "index.js"`).
- camelCase for all functions: `initialize()` in `src/initialize.js`, `generateCity()` in `src/city.js`, `generatePath()` in `src/path.js`, `animatePath()` in `src/animate.js`.
- Verb-first names for helpers: `create3dObjects`, `generateBuilding`, `generateRoad`, `normalizeCoordinates` (`src/city.js`); `initializeMarker`, `initializeEventListeners`, `castRay`, `addPoint`, `savePath` (`src/path.js`).
- Spawn helpers use the `spawn` prefix for scene insertion: `spawnBuildings`, `spawnRoads`, `spawnWater`, `spawnGreen`, `spawnGround` in `src/city.js`.
- Public API functions are exported in one `export { ... }` block at the bottom of each file: `src/initialize.js`, `src/city.js`, `src/path.js`, `src/animate.js`, `index.js`.
- `const` and `let` only. No `var` in the source files under `src/` (the sole `var` usages are in `download()` inside `savePath()` in `src/path.js`, lines 107-108).
- Shared state lives on the `GLOBAL` object in `src/globals.js`. Modules import it with an alias: `import { GLOBAL as $ } from "./globals";`. Use `$` for all shared state, for example `$.scene`, `$.camera`, `$.config`.
- Module-level constants and state use `UPPER_CASE` only in `src/animate.js` (`LINEPOINTCOUNT`, `DRAWRANGE`, `X`). `src/path.js` uses `max_points` (snake_case) for a local value.
- Mixed naming on `GLOBAL`: snake_case for `GLOBAL.config` keys (`color_background`, `color_buildings`, `opacity_ground`) and `GLOBAL.material_*` keys (`material_road`), and camelCase for the state fields (`cameraLookAtPos`, `lineArrayBackup`, `buildingArray`). Follow the style of the neighbouring keys.
- Use a `snake_case` local for building height: `building_levels` in `src/city.js`.
- No TypeScript and no JSDoc types. Plain JavaScript (ES modules).
- Three.js classes are referenced through the namespace import `import * as THREE from "three";`.

## Code Style

- Prettier is configured in `.prettierrc`:
- Indentation is tabs in every file under `src/` and `index.js`.
- Strings use double quotes: `"three"`, `"container"`.
- Put trailing commas in multi-line argument lists and object literals, as shown in `src/initialize.js` (the `PerspectiveCamera(...)` call) and `src/globals.js`.
- Wrap long argument lists one argument per line, with a trailing comma, as in `new THREE.BufferAttribute($.lineArray, 3)` broken across lines in `src/path.js`.
- Prettier is not enforced by a script or a pre-commit hook. `package.json` has no `format` or `lint` script. Run `npx prettier --write src index.js` by hand before committing.
- No ESLint or Biome config is present. No linting runs in the repo.
- Known lint issues in the current code, do not copy these:

## Import Organization

- None. Use relative paths (`./globals`, `./initialize`) inside `src/`.
- Imports omit file extensions (`"./globals"`, not `"./globals.js"`). This relies on the bundler (Vite is the documented host, see `INSTALLATION.md`).
- Index re-exports are not used. `index.js` imports each module directly from `./src/...`.

## Error Handling

- Little explicit error handling. Fetch results are assumed to succeed: `loadGeoJsonAsync()` in `src/city.js` and `loadPath()` in `src/animate.js` call `fetch(...).then((response) => response.json()...)` without checking `response.ok` or catching rejections.
- Guard with a truthiness or undefined check where a value can be absent: `if (road != undefined)` in `create3dObjects` (`src/city.js`); `if ($.lineClickCounter != 0)` in `src/path.js`.
- Default parameter values stand in for missing optional data: `data["building:levels"] || 1` in `src/city.js`, `height = 1` / `height = 0` defaults on the generator functions.
- `async` functions are used for I/O (`setup`, `start`, `generateCity`, `animatePath`) but their callers do not `await` them in `index.js`. Errors inside them surface as unhandled promise rejections.

## Logging

- Debug `console.log(...)` calls are commented out in every file (for example `src/animate.js` line 14, `src/city.js` lines 61, 145, 275).
- Do not add a live `console.log` to committed code. Remove it before the commit.

## Comments

- Short `//` line comments above a block to name its purpose, in the existing style: `//create threejs scene, populate global variables` (`index.js`), `//FPS COUNTER` (`src/initialize.js`), `//ANIMATED PATH` (`src/animate.js`).
- Section headers in ALL CAPS: `//CAMERA PATH`, `//PATH ANIMATION` (`src/animate.js`); `//GENERAL FUNCTION`, `//SPAWN GENERATED OBJECTS` (`src/city.js`).
- Explain the why for non-obvious math: `// Reverse X (it work)` in `normalizeCoordinates` (`src/city.js`).
- Dead code is kept as commented blocks (`// const gridHelper`, the `/* ... */` block in `updateLine` in `src/animate.js`). Prefer deleting it in new work.
- Not used.

## Function Design

- Positional parameters. Default values carry the config: `generateRoad(coordinates, properties, height = 0)`, `generateWater(coordinates, properties, height = 0.007)`.
- The `config` object argument is used for toggles in `setup()` and `start()` in `index.js`. Note: `generateCity(config)` accepts an object, but `setup()` calls it with four positional booleans, so the toggles are not applied. Pass one object consistently.
- Factory helpers return a new Three.js geometry: `generateBuilding`, `generateWater`, `generateGreen`, `generateRoad` (returns `undefined` for single-point roads).
- Side-effect helpers return nothing and write to `$.scene` or `$.*Array`.

## Module Design

- Named exports only. `export { setup, start, global };` in `index.js`. `export const GLOBAL` in `src/globals.js`.
- Each `src/` module exports only the functions its caller needs (`export { generatePath };`, `export { generateCity };`).
- Not used. `index.js` is the only public surface.
- All mutable scene state is written to `GLOBAL` in `src/globals.js`. Do not add module-level state that other modules must read. Exception: `src/city.js` and `src/path.js` keep `sphereMarker` and `animationScripts` as private module-level values. Keep private state private.

## Where to Put New Code

- New shared state fields: add to `GLOBAL` in `src/globals.js`, with the same key style as the neighbouring fields.
- New scene-building helpers: `src/city.js` (geometry) or `src/initialize.js` (scene, lights, camera).
- New interaction or path-drawing code: `src/path.js`.
- New animation code: `src/animate.js`.
- New public API: export from `index.js` only.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- One mutable global object (`GLOBAL`, exported as `global`) carries all runtime state. Every module imports it as `$`.
- Two runtime modes selected by the caller: `setup()` (author a path) and `start()` (play a saved path).
- Imperative three.js code. No framework, no component tree, no reactivity.
- Configuration is supplied by assigning `global.config` before calling `setup()` or `start()`. The defaults in `src/globals.js` are overwritten.
- Module dependency graph is a star. Each `src/*.js` module depends on `src/globals.js`. No `src/*.js` module imports another `src/*.js` module, except `index.js` and `src/initialize.js`, which is imported only by `index.js`. No circular imports exist.
- The repo ships no tests. The `test` script in `package.json` is a placeholder.

## Layers

- Purpose: Start-up sequencing and the package entry point.
- Location: `index.js`
- Contains: `setup`, `start`, and re-export of `global`.
- Depends on: `src/globals.js`, `src/initialize.js`, `src/city.js`, `src/path.js`, `src/animate.js`
- Used by: Consumer application (for example, a Vite `main.js` as shown in `README.md`).
- Purpose: Single source of shared runtime state and defaults.
- Location: `src/globals.js`
- Contains: `GLOBAL` object with scene handles, config defaults, geometry arrays, line buffers, and materials. Materials and vectors are constructed at import time.
- Depends on: `three`, `three/examples/jsm/lines/LineMaterial` (imported but unused)
- Used by: All other `src/*.js` modules.
- Purpose: Scene graph, camera, lights, renderer, and per-frame render.
- Location: `src/initialize.js`
- Contains: `initialize()`, `resize()`, `animate()`.
- Depends on: `src/globals.js`, `three`, `three/examples/jsm/controls/OrbitControls`, `three/examples/jsm/libs/stats.module`
- Used by: `index.js` only.
- Purpose: Convert OSM GeoJSON features into extruded or line geometry, merged per category.
- Location: `src/city.js`
- Contains: `generateCity()` (exported), `create3dObjects()`, `generateBuilding/Road/Water/Green()`, `generateShape()`, `generateGeometry()`, `spawn*()` functions, `normalizeCoordinates()`.
- Depends on: `src/globals.js`, `three`, `geolib`, `three/examples/jsm/utils/BufferGeometryUtils`
- Used by: `index.js` (both `setup` and `start`).
- Purpose: Interactive drawing of a camera path on the city.
- Location: `src/path.js`
- Contains: `generatePath()` (exported), raycast marker, mouse and keyboard handlers, `savePath()`.
- Depends on: `src/globals.js`, `three`, `geolib` (imported, unused)
- Used by: `index.js` `setup()` only.
- Purpose: Load a saved path, draw it progressively, and move the camera with scroll.
- Location: `src/animate.js`
- Contains: `animatePath()` (exported), `loadPath()`, `drawSpline()`, `drawLine()`, `initializeEventListeners()`, `playScrollAnimations()`, and the `animationScripts` table.
- Depends on: `src/globals.js`, `three`
- Used by: `index.js` `start()` only.

## Data Flow

### Primary Request Path (author mode, `setup()`)

### Primary Request Path (playback mode, `start()`)

### City Feature Dispatch

- All state lives on `GLOBAL` (`src/globals.js`). Modules write to it directly.
- Scroll position is `$.scrollpercentage`, written by a `scroll` listener and read by the animation loop.
- Path points live in `$.lineArray` (Float32, 3 values per point). `$.lineClickCounter` is the point count. `$.lineClickMax` is the redo ceiling.

## Key Abstractions

- Purpose: Shared runtime state and config defaults.
- Examples: `src/globals.js`
- Pattern: Exported mutable object. Consumers may override `config` before calling `setup()` or `start()`. It is also exposed as `global` from `index.js`.
- Purpose: Per-deployment settings (data URLs, container id, city center, colors, debug flag).
- Examples: `src/globals.js` (defaults), `README.md` (documented override)
- Pattern: Plain object. Read at call time, not captured at import time, so late assignment works.
- Purpose: One function per OSM category that returns a `THREE.BufferGeometry`.
- Examples: `generateBuilding`, `generateRoad`, `generateWater`, `generateGreen` in `src/city.js`
- Pattern: Polygon categories build a `THREE.Shape` (outer ring plus holes) and extrude it through `generateGeometry()`. Road geometry is a flat `BufferGeometry` of line vertices.
- Purpose: The camera route, shared between author and playback modes.
- Examples: `sample/path.json`, `$.lineArray` in `src/path.js`
- Pattern: Flat `Float32Array` for the draw line. Saved and loaded as a nested JSON array of `[x, y, z]`.
- Purpose: Map scroll ranges to frame-by-frame actions.
- Examples: `animationScripts` in `src/animate.js`
- Pattern: Array of `{ start, end, func }` evaluated every frame. Commented-out camera scripts show the intended extension point.
- Purpose: Convert lat/lon to local planar x/z around `config.citycenter`.
- Examples: `normalizeCoordinates()` in `src/city.js`
- Pattern: Uses `geolib` distance and rhumb bearing, then scales by 1/100. The x axis is negated. Output is `[x, z]` pairs.

## Entry Points

- Location: `index.js` (`package.json` `main` field)
- Triggers: Consumer `import * as storymaps from "storymap"`.
- Responsibilities: Exports `setup`, `start`, and `global`.
- Location: `index.js`
- Triggers: Consumer call, typically from `main.js` in the consumer app.
- Responsibilities: Author mode. Calls `initialize()`, `animate()`, `generateCity(...)`, `generatePath()`. The `config` argument is read for its keys, but the values are passed as four positional booleans to `generateCity`, which accepts one object. The flags have no effect.
- Location: `index.js`
- Triggers: Consumer call after a path has been saved.
- Responsibilities: Playback mode. Calls `initialize()`, `animate()`, `generateCity(config)`, `animatePath()`.
- Location: `src/animate.js` (`animate()`)
- Triggers: `requestAnimationFrame` after `animatePath()`.
- Responsibilities: Evaluate `animationScripts` each frame.
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

### Bare DOM id as a variable

### Ambient `event` in a handler helper

### Dead code that still references undefined identifiers

### Camera target passed as an array

### Mutable state shared across two modes

## Error Handling

- `loadGeoJsonAsync()` and `loadPath()` return promises without a catch. The caller `generateCity` and `animatePath` do not handle rejection.
- `spawnBuildings()` calls `mergeBufferGeometries($.buildingArray)`. If the array is empty, the merge returns `null`, and `new THREE.Mesh(null, ...)` fails later. No guard exists.
- `create3dObjects` guards roads with `generateRoad(...) != undefined`. Other categories have no such guard.

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
