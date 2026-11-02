---
last_mapped_commit: 29755b9a527ac50aa8e3f7ee73bc365a2e92da7d
last_mapped_at: 2026-11-02
---
<!-- refreshed: 2026-11-02 -->
# Coding Conventions

**Analysis Date:** 2026-11-02

## Naming Patterns

**Files:**
- Lowercase single-word module names under `src/`: `src/globals.js`, `src/initialize.js`, `src/city.js`, `src/path.js`, `src/animate.js`.
- Package entry point at repo root: `index.js` (declared in `package.json` as `"main": "index.js"`).

**Functions:**
- camelCase for all functions: `initialize()` in `src/initialize.js`, `generateCity()` in `src/city.js`, `generatePath()` in `src/path.js`, `animatePath()` in `src/animate.js`.
- Verb-first names for helpers: `create3dObjects`, `generateBuilding`, `generateRoad`, `normalizeCoordinates` (`src/city.js`); `initializeMarker`, `initializeEventListeners`, `castRay`, `addPoint`, `savePath` (`src/path.js`).
- Spawn helpers use the `spawn` prefix for scene insertion: `spawnBuildings`, `spawnRoads`, `spawnWater`, `spawnGreen`, `spawnGround` in `src/city.js`.
- Public API functions are exported in one `export { ... }` block at the bottom of each file: `src/initialize.js`, `src/city.js`, `src/path.js`, `src/animate.js`, `index.js`.

**Variables:**
- `const` and `let` only. No `var` in the source files under `src/` (the sole `var` usages are in `download()` inside `savePath()` in `src/path.js`, lines 107-108).
- Shared state lives on the `GLOBAL` object in `src/globals.js`. Modules import it with an alias: `import { GLOBAL as $ } from "./globals";`. Use `$` for all shared state, for example `$.scene`, `$.camera`, `$.config`.
- Module-level constants and state use `UPPER_CASE` only in `src/animate.js` (`LINEPOINTCOUNT`, `DRAWRANGE`, `X`). `src/path.js` uses `max_points` (snake_case) for a local value.
- Mixed naming on `GLOBAL`: snake_case for `GLOBAL.config` keys (`color_background`, `color_buildings`, `opacity_ground`) and `GLOBAL.material_*` keys (`material_road`), and camelCase for the state fields (`cameraLookAtPos`, `lineArrayBackup`, `buildingArray`). Follow the style of the neighbouring keys.
- Use a `snake_case` local for building height: `building_levels` in `src/city.js`.

**Types:**
- No TypeScript and no JSDoc types. Plain JavaScript (ES modules).
- Three.js classes are referenced through the namespace import `import * as THREE from "three";`.

## Code Style

**Formatting:**
- Prettier is configured in `.prettierrc`:
  - `"useTabs": true`
  - `"tabWidth": 4`
  - `"trailingComma": "all"`
  - `"semi": true`
  - `"bracketSameLine": true`
  - `"jsxSingleQuote": true` (no JSX in this repo; ignore)
- Indentation is tabs in every file under `src/` and `index.js`.
- Strings use double quotes: `"three"`, `"container"`.
- Put trailing commas in multi-line argument lists and object literals, as shown in `src/initialize.js` (the `PerspectiveCamera(...)` call) and `src/globals.js`.
- Wrap long argument lists one argument per line, with a trailing comma, as in `new THREE.BufferAttribute($.lineArray, 3)` broken across lines in `src/path.js`.
- Prettier is not enforced by a script or a pre-commit hook. `package.json` has no `format` or `lint` script. Run `npx prettier --write src index.js` by hand before committing.

**Linting:**
- No ESLint or Biome config is present. No linting runs in the repo.
- Known lint issues in the current code, do not copy these:
  - Loose equality `==` in `src/city.js` (lines 46, 97, 120, 139: `index == 0`), `src/initialize.js` (lines 59, 107: `$.config.debug == true`), and `src/path.js` (lines 25, 34, 43, 46: `$.hit == true`, `event.key == "s"`). `src/path.js` lines 52 and 59 already use `===`. Use `===` in new code.
  - Unused imports: `GEOLIB` and `Vector3` in `src/path.js` (lines 3-4); `LineMaterial` in `src/globals.js` (line 2).
  - Unused variables and dead functions: `drawTube()` in `src/animate.js` references an undefined `shape`; `spawnSpline()` is defined inside `drawSpline()` and never called; `showScrollPercentage()` is empty.
  - Implicit globals: `container` is read as a bare identifier in `src/initialize.js` (`container.clientWidth`, `container.appendChild`) instead of `$.container`. Use `$.container`.

## Import Organization

**Order (observed in `src/city.js`, `src/initialize.js`, `src/path.js`):**
1. Shared state: `import { GLOBAL as $ } from "./globals";`
2. Third-party packages: `three`, `geolib`
3. Three.js addons from `three/examples/jsm/...`

**Path Aliases:**
- None. Use relative paths (`./globals`, `./initialize`) inside `src/`.
- Imports omit file extensions (`"./globals"`, not `"./globals.js"`). This relies on the bundler (Vite is the documented host, see `INSTALLATION.md`).
- Index re-exports are not used. `index.js` imports each module directly from `./src/...`.

## Error Handling

**Patterns:**
- Little explicit error handling. Fetch results are assumed to succeed: `loadGeoJsonAsync()` in `src/city.js` and `loadPath()` in `src/animate.js` call `fetch(...).then((response) => response.json()...)` without checking `response.ok` or catching rejections.
- Guard with a truthiness or undefined check where a value can be absent: `if (road != undefined)` in `create3dObjects` (`src/city.js`); `if ($.lineClickCounter != 0)` in `src/path.js`.
- Default parameter values stand in for missing optional data: `data["building:levels"] || 1` in `src/city.js`, `height = 1` / `height = 0` defaults on the generator functions.
- `async` functions are used for I/O (`setup`, `start`, `generateCity`, `animatePath`) but their callers do not `await` them in `index.js`. Errors inside them surface as unhandled promise rejections.

**Recommended for new code:** return `undefined` or throw an `Error` with a message on bad input, and `await` the async entry points in `index.js`.

## Logging

**Framework:** `console` only, and only in comments.

**Patterns:**
- Debug `console.log(...)` calls are commented out in every file (for example `src/animate.js` line 14, `src/city.js` lines 61, 145, 275).
- Do not add a live `console.log` to committed code. Remove it before the commit.

## Comments

**When to Comment:**
- Short `//` line comments above a block to name its purpose, in the existing style: `//create threejs scene, populate global variables` (`index.js`), `//FPS COUNTER` (`src/initialize.js`), `//ANIMATED PATH` (`src/animate.js`).
- Section headers in ALL CAPS: `//CAMERA PATH`, `//PATH ANIMATION` (`src/animate.js`); `//GENERAL FUNCTION`, `//SPAWN GENERATED OBJECTS` (`src/city.js`).
- Explain the why for non-obvious math: `// Reverse X (it work)` in `normalizeCoordinates` (`src/city.js`).
- Dead code is kept as commented blocks (`// const gridHelper`, the `/* ... */` block in `updateLine` in `src/animate.js`). Prefer deleting it in new work.

**JSDoc/TSDoc:**
- Not used.

## Function Design

**Size:** Functions are mostly short helpers. `initialize()` in `src/initialize.js` (about 80 lines) and `playScrollAnimations`/the animation closure in `src/animate.js` are the long ones. Split new long setup code into named helpers at module scope.

**Parameters:**
- Positional parameters. Default values carry the config: `generateRoad(coordinates, properties, height = 0)`, `generateWater(coordinates, properties, height = 0.007)`.
- The `config` object argument is used for toggles in `setup()` and `start()` in `index.js`. Note: `generateCity(config)` accepts an object, but `setup()` calls it with four positional booleans, so the toggles are not applied. Pass one object consistently.

**Return Values:**
- Factory helpers return a new Three.js geometry: `generateBuilding`, `generateWater`, `generateGreen`, `generateRoad` (returns `undefined` for single-point roads).
- Side-effect helpers return nothing and write to `$.scene` or `$.*Array`.

## Module Design

**Exports:**
- Named exports only. `export { setup, start, global };` in `index.js`. `export const GLOBAL` in `src/globals.js`.
- Each `src/` module exports only the functions its caller needs (`export { generatePath };`, `export { generateCity };`).

**Barrel Files:**
- Not used. `index.js` is the only public surface.

**State ownership:**
- All mutable scene state is written to `GLOBAL` in `src/globals.js`. Do not add module-level state that other modules must read. Exception: `src/city.js` and `src/path.js` keep `sphereMarker` and `animationScripts` as private module-level values. Keep private state private.

## Where to Put New Code

- New shared state fields: add to `GLOBAL` in `src/globals.js`, with the same key style as the neighbouring fields.
- New scene-building helpers: `src/city.js` (geometry) or `src/initialize.js` (scene, lights, camera).
- New interaction or path-drawing code: `src/path.js`.
- New animation code: `src/animate.js`.
- New public API: export from `index.js` only.

---

*Convention analysis: 2026-11-02*
