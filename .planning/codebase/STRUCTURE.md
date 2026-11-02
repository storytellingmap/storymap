---
last_mapped_commit: 29755b9a527ac50aa8e3f7ee73bc365a2e92da7d
last_mapped_at: 2026-11-02
---
# Codebase Structure

**Analysis Date:** 2026-11-02

## Directory Layout

```
night-gsd-standard/                  # repo root (npm package "storymap")
├── index.js                         # Package entry: exports setup, start, global
├── package.json                     # Package manifest, dependencies (three, geolib)
├── src/                             # All runtime modules (ES modules, no build)
│   ├── globals.js                   # Shared GLOBAL state and config defaults
│   ├── initialize.js                # Scene, camera, lights, renderer, render loop
│   ├── city.js                      # GeoJSON → 3D meshes (city generator)
│   ├── path.js                      # Author mode: draw and save a camera path
│   └── animate.js                   # Play mode: load path, scroll-driven animation
├── sample/                          # Example data
│   ├── bruges.geojson               # Overpass export, default data source
│   ├── small.geojson                # Smaller Overpass export
│   └── path.json                    # Saved camera path as [[x,y,z], ...]
├── README.md                        # Usage and configuration reference
├── INSTALLATION.md                  # Consumer setup (Vite, HTML markup)
├── DOCS.md                          # Per-module one-paragraph descriptions
├── ANSWERS.md                       # Project Q&A notes
├── SOURCES.md                       # Sources and attributions
├── .prettierrc                      # Formatter settings (tabs, width 4, trailing commas)
├── .gitattributes                   # Git attribute rules
└── .gitignore                       # Ignores node_modules, dist, lock files, .DS_Store
```

`.planning/` holds GSD working data and is not part of the package.

## Directory Purposes

**`src/`:**
- Purpose: Every runtime module. Each file owns one concern of the pipeline.
- Contains: ES module `.js` files. No subfolders. No tests. No TypeScript.
- Key files: `src/globals.js` (state), `src/initialize.js` (scene), `src/city.js` (geometry), `src/path.js` (author), `src/animate.js` (play)

**`sample/`:**
- Purpose: Demo data for `config.data` and `config.path`.
- Contains: GeoJSON from overpass-turbo (`timestamp` 2022-02-02, ODbL) and a JSON path array.
- Key files: `sample/bruges.geojson` (default `data` value in `src/globals.js`), `sample/path.json` (default `path` value)

**Repo root (documentation):**
- Purpose: Human-facing docs for the package and its consumers.
- Contains: Markdown files.
- Key files: `README.md` (configuration), `INSTALLATION.md` (consumer setup), `DOCS.md` (module list)

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents consumed by planning and execution commands.
- Contains: `ARCHITECTURE.md`, `STRUCTURE.md`, and other focus-area docs.
- Generated: Yes (by the codebase mapper)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `index.js`: Package main. Exports `setup`, `start`, `global`.

**Configuration:**
- `src/globals.js`: Default `config` object. Override at runtime through `global.config`.
- `package.json`: Package metadata and dependency versions (`three` `^0.137.5`, `geolib` `^3.3.3`).
- `.prettierrc`: Code style (tabs, print width default, trailing commas, `bracketSameLine`).

**Core Logic:**
- `src/city.js`: OSM feature routing and extrusion. `generateCity()` is the public function.
- `src/initialize.js`: Scene and render loop. `initialize()` and `animate()`.
- `src/path.js`: Author-mode interaction. `generatePath()` is the public function.
- `src/animate.js`: Play-mode animation. `animatePath()` is the public function. `animationScripts` table is the extension point.

**Shared State:**
- `src/globals.js`: `GLOBAL` object. Used by every module.

**Testing:**
- Not applicable. No test files exist. `package.json` `test` script is a placeholder.

**Documentation:**
- `README.md`, `INSTALLATION.md`, `DOCS.md`, `ANSWERS.md`, `SOURCES.md`

## Naming Conventions

**Files:**
- Lowercase single-word module names in `src/`: `globals.js`, `city.js`, `path.js`, `animate.js`, `initialize.js`
- Sample data in lowercase with extension: `bruges.geojson`, `small.geojson`, `path.json`
- Top-level docs in uppercase: `README.md`, `INSTALLATION.md`, `DOCS.md`, `ANSWERS.md`, `SOURCES.md`

**Directories:**
- Lowercase single word: `src`, `sample`

**Functions:**
- camelCase verbs. Public exports use plain verbs (`setup`, `start`, `generateCity`, `generatePath`, `animatePath`, `initialize`, `animate`).
- Internal generators use `generate<Thing>` (`generateBuilding`, `generateRoad`, `generateWater`, `generateGreen`, `generateShape`, `generateGeometry`).
- Mesh spawners use `spawn<Thing>` (`spawnBuildings`, `spawnRoads`, `spawnWater`, `spawnGreen`, `spawnGround`).
- Loaders use `load<Thing>Async` or `loadPath`.

**Variables:**
- The shared state is imported as `$` in every module: `import { GLOBAL as $ } from "./globals";`. Keep this alias in new modules.
- Module-level constants and counters in `src/animate.js` use upper case: `LINEPOINTCOUNT`, `DRAWRANGE`.
- Three.js objects are named `<role><Type>` in camelCase: `light1`, `grid`, `sphereMarker`.

**Section markers:**
- Comments in upper case headers separate sections in modules: `//GENERAL FUNCTION`, `//SPAWN GENERATED OBJECTS`, `//ANIMATED PATH`, `//CAMERA PATH`.

**Global state keys:**
- Config keys use `snake_case` (`color_background`, `color_buildings`, `opacity_ground`).
- Runtime state keys use `camelCase` (`buildingArray`, `lineClickCounter`, `cameraLookAtPos`).
- Material keys use `material_<thing>` (`material_road`, `material_water`).

**Indentation and formatting:**
- Tabs, width 4, trailing commas, double quotes (`.prettierrc`). Keep these in new code.

## Where to Add New Code

**New city feature category (for example, parks or rail):**
- Routing: add a branch in `create3dObjects()` in `src/city.js`
- Generator: add `generate<Thing>()` in `src/city.js`, following the pattern of `generateGreen()`
- Spawner: add `spawn<Thing>()` in `src/city.js` and call it from `generateCity()`
- Material: add `material_<thing>` to `src/globals.js`
- Tests: none exist. Add them under `src/__tests__/` or a top-level `test/` folder if a test runner is introduced.

**New author-mode tool (for example, undo to a marker or a new key binding):**
- Implementation: `src/path.js`, inside `initializeEventListeners()`, next to the existing `onKeyUp` branches.
- State: store new fields on `$` in `src/globals.js` so `savePath()` can read them.

**New playback behaviour (for example, a camera move at a scroll range):**
- Implementation: add an entry to `animationScripts` in `src/animate.js`, with `start`, `end`, and `func`. Follow the pattern of the existing path entry.
- Helpers: place the helper below `playScrollAnimations()` in `src/animate.js`.

**New scene element (light, helper, background object):**
- Implementation: `src/initialize.js`, inside `initialize()`. Put debug-only objects inside the `if ($.config.debug == true)` block.

**New configuration option:**
- Default: add the key to `config` in `src/globals.js`.
- Documentation: add the key to the example in `README.md`.

**New public API function:**
- Export from `index.js`. Keep `setup` and `start` as the two modes.

**New sample data:**
- Place under `sample/`. Reference it from the consumer `config.data` or `config.path`.

**Utilities:**
- No shared utilities folder exists. Shared helpers belong in the module that uses them. If three or more modules need one, create `src/utils.js` and import it by relative path.

## Special Directories

**`sample/`:**
- Purpose: Demo GeoJSON and path JSON used by default config.
- Generated: `bruges.geojson` and `small.geojson` are Overpass Turbo exports. `path.json` is saved by the `s` key in author mode (`src/path.js`).
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning and codebase-map data.
- Generated: Yes (by GSD commands)
- Committed: Yes (planning documents). GSD runtime state is ignored in `.gitignore`.

**`node_modules/`:**
- Purpose: Installed dependencies in the consumer app.
- Generated: Yes
- Committed: No (listed in `.gitignore`)

**`dist/`, `dist-ssr/`:**
- Purpose: Consumer build output. Not produced by this repo.
- Generated: Yes
- Committed: No (listed in `.gitignore`)

---

*Structure analysis: 2026-11-02*
