# Requirements: storymap

**Defined:** 2026-11-02
**Core Value:** An author can turn an OpenStreetMap extract and a drawn path into a scroll-driven 3D story that runs
in a reader's browser.

## v1 Requirements

Milestone v1.1 Revive. Health check first, then fixes, then the dependency refresh. No new features. Sources:
`.planning/PROJECT.md` (Active), `.planning/codebase/CONCERNS.md`, `.planning/research/` (2026-11-02).

### Health check

- [ ] **HLTH-01**: Maintainer can start the Bruges sample in a browser with `npm run dev:up` and stop it with
  `npm run dev:down`, from this repo, on the pinned 2022 versions (`three` 0.137.5, `geolib` 3.3.x)
- [ ] **HLTH-02**: A written health report records, on the pinned versions: whether `setup()` and `start()` run on
  `sample/bruges.geojson` and `sample/small.geojson`, every console error, the result of the documented install path
  (`INSTALLATION.md`) in a scratch consumer, whether the demo and thesis URLs answer, the stale dependencies, and a
  screenshot baseline of author and reader mode
- [ ] **HLTH-03**: The health report names the cause of issue #2 (`computeBoundingSphere()` radius `NaN`) with the
  dataset and the feature ids that trigger it
- [ ] **HLTH-04**: The health report confirms or rejects each candidate defect from research: `MapControls` exists
  only in debug mode, click raycast uses the window size instead of the canvas, mouse controls override the scroll
  camera in reader mode, `camera.lookAt()` receives an array

### Automated check

- [ ] **TEST-01**: `npm test` runs a Node check of the data path: every Bruges and small-sample feature produces
  finite scene coordinates, and every point of `sample/path.json` lies on a road; it fails on the 2022 code
- [ ] **TEST-02**: `npm test` runs a headless-browser check of `setup()` and `start()` on the Bruges sample: no
  console error, a non-empty canvas, a finite camera position at 0 %, 50 % and 100 % scroll

### Fixes

- [ ] **FIX-01**: Issue #2 is fixed: `Polygon`, multi-ring and `MultiPolygon` features (buildings and roads) render
  with finite geometry, and `Point` features are skipped, so Bruges loads with no `NaN` error
- [ ] **FIX-02**: Integrator can set any container id in `global.config.container`; scene setup and window resize
  both use it
- [ ] **FIX-03**: The layer flags (`buildings`, `roads`, `water`, `green`) passed to `setup()` and `start()` decide
  which layers spawn, and a dataset with an empty layer still loads
- [ ] **FIX-04**: Reader sees the line draw and the camera follow the path from 0 % to 100 % scroll with no `NaN` and
  no jump to the origin, also on a page that is not taller than the viewport
- [ ] **FIX-05**: Author can draw a path of more than 600 points, or sees a message at the limit; the saved path never
  contains empty entries
- [ ] **FIX-06**: Each candidate defect that HLTH-04 confirms is fixed

### Docs

- [ ] **DOCS-01**: `INSTALLATION.md` lists the keys the code uses (`R` reset, `Z` undo, `X` redo, `S` save) and
  installs from `storytellingmap/storymap`
- [ ] **DOCS-02**: `DOCS.md` names the modules where they live (`src/`)
- [ ] **DOCS-03**: `package.json` `repository`, `bugs` and `homepage` point to `storytellingmap/storymap`, and
  `directories.example` names a folder that exists or is gone

### Dependencies

- [ ] **DEPS-01**: The library runs on the current `three` release (0.187.x) with the renamed APIs and `.js` addon
  import paths, and the automated check passes
- [ ] **DEPS-02**: The library runs on `geolib` 4, and `sample/path.json` still lies on the roads (TEST-01 passes)
- [ ] **DEPS-03**: The dev toolchain declares Node 26 LTS (`.node-version`), and installs are reproducible
  (`package-lock.json` committed)
- [ ] **DEPS-04**: Author and reader mode on the new `three` look like the HLTH-02 screenshot baseline (lighting and
  colour), judged by eye

## v2 Requirements

Deferred. Tracked, not in the v1.1 roadmap. Detailed requirements come from `/gsd-new-milestone`.

### v2.0 Monorepo (cockpit hub task)

- **MONO-01**: The chosen `storytellingmap` org repos live in one open-source monorepo under `elfensky`
- **MONO-02**: The monorepo carries an open-source licence that replaces `UNLICENSED`
- **MONO-03**: Each migrated `storytellingmap` repo points to the monorepo
- Open facts for Andrei: which of the eight org repos go in (the thesis and three demo repos are private), which
  licence, and what happens to the private `storytellingmap` core package versus this repo

### v2.1 2022 review items

- **REV-01**: Integrator installs the package from npm, so a demo needs no `npm link` (the unscoped name `storymap`
  is taken; needs a scoped name and the v2.0 licence)
- **REV-02**: Reader sees the path behind buildings: an arrow at the path end, or the path drawn on top with
  transparency
- **REV-03**: Reader sees the described buildings highlighted as the camera approaches them
- **REV-04**: Integrator uses a simpler integration API

### Later

- **TEST-03**: CI runs `npm test` on every pull request (headless WebGL on a Linux runner is not yet proven)
- **LOAD-01**: A failed GeoJSON or path load reaches the caller as an error instead of a blank canvas

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features in v1.1 (chapters, text sync, markers) | v1.1 is health and fixes; new code on unverified code hides which change broke what |
| Pixel-exact screenshot comparison as the automated check | Headless WebGL output differs per GPU and flag set; DEPS-04 is a human judgement instead |
| Road routing or map matching between clicks | Needs a road graph or an external router and changes the saved path format |
| Tiles, level of detail, 3D terrain, other map sources | `PROJECT.md` Out of Scope; each adds a server or a token |
| Adaptive render resolution | `ANSWERS.md` records it as not needed |
| Scroll hijacking or a custom smooth-scroll layer | Breaks keyboard scroll and screen readers |
| WebGPU renderer, TypeScript rewrite | Rewrites; the library stays plain JavaScript on `WebGLRenderer` |
| Touch authoring | Author mode is a desktop task |
| The Polarsteps-on-Immich route view | Belongs to another project |
| Hosting the demo site | This repo deploys nothing |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19 ⚠️

---
*Requirements defined: 2026-11-02*
*Last updated: 2026-11-02 after initial definition*
