# storymap

## What This Is

`storymap` is a browser JavaScript library for scroll-driven animated story maps. It builds a 3D city in three.js
from an OpenStreetMap GeoJSON export (Overpass Turbo), lets an author draw a path along the roads and save it as
JSON, and plays that path back on scroll: the line draws itself and the camera follows it. It began as Andrei's 2022
Bachelorproef (semester-7 research project); authors who want to tell a story along a route through a city are the
users, and Andrei is the only maintainer.

## Core Value

An author can turn an OpenStreetMap extract and a drawn path into a scroll-driven 3D story that runs in a reader's
browser.

## Requirements

### Validated

<!-- Shipped in 2022 (v1.0, code last changed 2022-05-25). Not re-run since; issue #2 reports the project does not
start. The first phase of the current milestone re-checks every item below. -->

- ✓ Generate a 3D city from an Overpass Turbo GeoJSON export: extruded buildings (height from `building:levels`),
  roads, water, green areas and a ground plane — v1.0 (2022)
- ✓ Author mode (`setup()`): click on roads to draw a path; `R` resets, `Z` undoes, `X` redoes, `S` downloads the
  path as JSON — v1.0 (2022)
- ✓ Reader mode (`start()`): load a saved path and animate it on scroll; the line draws and the camera follows —
  v1.0 (2022)
- ✓ Configuration through `global.config`: GeoJSON URL, path URL, container id, city centre, colours — v1.0 (2022)
- ✓ Bruges sample data (`sample/bruges.geojson`, `sample/small.geojson`, `sample/path.json`) — v1.0 (2022)

### Active

<!-- Current milestone: v1.1 Revive. Health check first, no new features. -->

- [ ] Health report: install the library into a fresh Vite consumer as `INSTALLATION.md` says, run `setup()` and
  `start()` on the Bruges sample, and record what works and what fails
- [ ] Reproduce and fix issue #2 ("Project not starting": `computeBoundingSphere()` radius is `NaN`)
- [ ] Fix the defects the health check confirms: bare `container` identifier, ignored layer flags, out-of-range
  scroll indexes, the silent 600-point limit
- [ ] Correct the docs: `INSTALLATION.md` key list, `DOCS.md` module paths, `package.json` URLs and
  `directories.example`
- [ ] Replace the `npm test` placeholder with a check that fails when the sample breaks
- [ ] Refresh dependencies: current `three` (rename `ExtrudeBufferGeometry`, fix `three/examples/jsm` import paths)
  and `geolib` 4; dev toolchain on the current Node LTS

### Planned milestones

<!-- Tracked here so the roadmap carries them; detailed requirements come from /gsd-new-milestone. -->

- **v2.0 Monorepo** (cockpit hub task): migrate the `storytellingmap` org into one open-source monorepo under
  `elfensky`. Open facts that need Andrei: which of the eight org repos go in, which licence replaces `UNLICENSED`,
  and what happens to the private `storytellingmap` core package versus this repo.
- **v2.1 2022 review items** (2022 UX and code review): publish to npm so a demo needs no `npm link`; keep the path
  visible behind buildings (arrow at the path end, or path drawn on top with transparency); highlight described
  buildings as the reader approaches; a simpler integration API.

### Out of Scope

- New features beyond the four 2022 review items — no source asks for them
- The Polarsteps-on-Immich route view — the vault names the route engine as possible reuse; that work belongs to
  another project
- Hosting or redesigning the demo site (https://tania.tours/demo) — this repo deploys nothing
- Adaptive render resolution — `ANSWERS.md` records it as not needed
- 3D terrain and other map sources (3dbuildings, Cesium, Mapbox) — they appear only as references in `SOURCES.md`

## Context

- **Repo and org.** `storytellingmap/storymap` is public (transferred from `elfensky/storymap`, which redirects).
  The `storytellingmap` org holds eight repos: `storymap`, `storytellingmap` (private core npm package), `thesis`
  (private, LaTeX), `demo-client`, `demo-admin`, `demos` (private), `demo1-read-story` (private), `.github`.
- **Activity.** Last code change 2022-05-25. Last push 2024-03-05 (README: demos moved to
  https://tania.tours/demo, thesis at https://lavrenov.io/thesis/thesis.pdf).
- **Open issue.** #2 "Project not starting" (2024-08-05, outside user): `THREE.BufferGeometry.computeBoundingSphere():
  Computed radius is NaN`. No milestones, no PRs.
- **Codebase.** Five ES modules in `src/` around one mutable singleton (`GLOBAL` in `src/globals.js`); entry
  `index.js`. No build, no tests, no linter, no CI. Prettier config only. `three` `^0.137.5` (latest 0.187.0) and
  `geolib` `^3.3.3` (latest 4.0.1). `package-lock.json` is gitignored. The package is not on npm; consumers install
  it from the GitHub URL. Details: `.planning/codebase/`.
- **Known defects.** See `.planning/codebase/CONCERNS.md`: layer flags ignored, bare `container` global,
  600-point path buffer, out-of-range scroll indexes (`NaN` camera), doc mismatches, deprecated
  `ExtrudeBufferGeometry`, dead code in `src/animate.js` and `src/path.js`.
- **Projection.** Saved paths are scene coordinates from `normalizeCoordinates()` in `src/city.js` (`geolib` around
  `config.citycenter`, scaled by `/100`). A projection change invalidates `sample/path.json`.

## Constraints

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

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Health check is the first phase, no new features in v1.1 | Code untouched since 2022; issue #2 says it does not start | — Pending |
| `.planning/ROADMAP.md` is the only roadmap; keijiban publishes it | keijiban standard, decided 2026-11-01 | ✓ Good |
| Monorepo migration is its own milestone (v2.0), after v1.1 | Cockpit hub task; needs licence and scope decisions from Andrei | — Pending |
| 2022 review items wait for v2.1 | They build on a working, migrated codebase | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-02 after initialization*
