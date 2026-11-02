# Roadmap: storymap

## Overview

v1.1 Revive brings the 2022 Bachelorproef code back to a known, working state, with no new features. It first records
what the 2022 code does on its pinned versions (`three` 0.137.5, `geolib` 3.3.x). Then it adds an automated check that
fails on the 2022 code, and fixes the confirmed defects on the same pinned versions. Then it moves to current `three`,
`geolib` 4 and a Node 26 toolchain, against the 2022 screenshot baseline. The docs are corrected last, so they describe
the final code. Each step makes the failures of the next step traceable. v2.0 and v2.1 are planned milestones; their
phases come from `/gsd-new-milestone`.

## Milestones

- ✅ **v1.0 Bachelorproef** - the 2022 code, before GSD, no GSD phases (shipped 2022-05-25)
- 🚧 **v1.1 Revive** - Phases 1-4 (in progress)
- 📋 **v2.0 Monorepo** - Phases TBD (planned)
- 📋 **v2.1 2022 review items** - Phases TBD (planned)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### 🚧 v1.1 Revive (In Progress)

**Milestone Goal:** The 2022 library runs again. A health report records what was broken, `npm test` guards the
Bruges sample, the confirmed defects are fixed, the dependencies are current, and the docs match the code.

- [ ] **Phase 1: Health check on the 2022 versions** - Record what runs and what fails on `three` 0.137.5 and `geolib` 3.3.x, and the cause of issue #2; no fixes
- [ ] **Phase 2: Automated check and defect fixes** - `npm test` fails on the 2022 code; fix issue #2 and the confirmed defects on the pinned versions until it passes
- [ ] **Phase 3: Dependency refresh** - Current `three` 0.187.x, `geolib` 4, Node 26 toolchain and a committed lockfile, with the 2022 look kept
- [ ] **Phase 4: Docs match the code** - `INSTALLATION.md`, `DOCS.md` and `package.json` describe the final code and the `storytellingmap/storymap` repo

#### Phase 1: Health check on the 2022 versions
**Goal**: Andrei knows, from a written health report, what runs and what fails in the 2022 code on its pinned versions, and what causes issue #2. No code fix lands in this phase.
**Depends on**: Nothing (first phase)
**Requirements**: HLTH-01, HLTH-02, HLTH-03, HLTH-04
**Success Criteria** (what must be TRUE):
  1. Maintainer starts the Bruges sample in a browser with `npm run dev:up` and stops it with `npm run dev:down`, from this repo, on `three` 0.137.5 and `geolib` 3.3.x
  2. The health report records, for `sample/bruges.geojson` and `sample/small.geojson`, whether `setup()` and `start()` run and every console error. It also records the result of the `INSTALLATION.md` install path in a scratch consumer, whether the demo and thesis URLs answer, and the stale dependencies
  3. The health report holds screenshots of author mode and of reader mode at 0 %, 50 % and 100 % scroll on the pinned versions, as the baseline for the dependency refresh
  4. The health report names the cause of issue #2 (`computeBoundingSphere()` radius `NaN`), with the dataset and the feature ids that trigger it
  5. The health report marks each candidate defect as confirmed or rejected, with its evidence: `MapControls` only in debug mode, click raycast on the window size instead of the canvas, mouse controls against the scroll camera in reader mode, `camera.lookAt()` with an array
**Plans**: TBD

#### Phase 2: Automated check and defect fixes
**Goal**: The Bruges sample starts and plays from end to end on the pinned 2022 versions, and `npm test` proves it: the check fails on the 2022 code and passes after the fixes.
**Depends on**: Phase 1 (the health report sets the scope of FIX-06)
**Requirements**: TEST-01, TEST-02, FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06
**Success Criteria** (what must be TRUE):
  1. `npm test` runs a Node check of the data path (finite scene coordinates for every Bruges and small-sample feature, every point of `sample/path.json` on a road) and a headless-browser check of `setup()` and `start()` on Bruges (no console error, a non-empty canvas, a finite camera position at 0 %, 50 % and 100 % scroll). Run against the 2022 code, it fails
  2. Bruges loads in author mode and in reader mode with no `NaN` error: `Polygon`, multi-ring and `MultiPolygon` buildings and roads render with finite geometry, and `Point` features are skipped
  3. Integrator sets any container id in `global.config.container` and any combination of the layer flags (`buildings`, `roads`, `water`, `green`) in `setup()` and `start()`. Scene setup and window resize use that container, only the chosen layers spawn, and a dataset with an empty layer still loads
  4. Reader scrolls from 0 % to 100 % and sees the line draw and the camera follow the path, with no `NaN` and no jump to the origin, also on a page that is not taller than the viewport. Author draws a path of more than 600 points or sees a message at the limit, and the saved path holds no empty entries
  5. Each candidate defect that the health report confirmed is fixed, and `npm test` passes on the pinned 2022 versions
**Plans**: TBD
**UI hint**: no

#### Phase 3: Dependency refresh
**Goal**: The library runs on current `three` 0.187.x, `geolib` 4 and a Node 26 toolchain, with reproducible installs, and looks like the 2022 baseline.
**Depends on**: Phase 2 (a green check on the pinned versions)
**Requirements**: DEPS-01, DEPS-02, DEPS-03, DEPS-04
**Success Criteria** (what must be TRUE):
  1. Author mode and reader mode run on `three` 0.187.x, with the renamed APIs and the `.js` addon import paths, and `npm test` passes
  2. On `geolib` 4, every point of `sample/path.json` still lies on a road (the TEST-01 check passes)
  3. A fresh clone on Node 26 (from `.node-version`) installs the same dependency tree from the committed `package-lock.json`
  4. Andrei compares author mode and reader mode with the Phase 1 screenshot baseline and judges the lighting and colour to be the same
**Plans**: TBD

#### Phase 4: Docs match the code
**Goal**: An integrator who follows the docs gets a working story map from `storytellingmap/storymap`, and every documented key, path and link matches the code.
**Depends on**: Phase 3 (the docs describe the final dependency set)
**Requirements**: DOCS-01, DOCS-02, DOCS-03
**Success Criteria** (what must be TRUE):
  1. Integrator follows `INSTALLATION.md` in a fresh scratch consumer, installs from `storytellingmap/storymap`, and gets the Bruges scene running
  2. The keys that `INSTALLATION.md` lists (`R` reset, `Z` undo, `X` redo, `S` save) do in author mode what it says
  3. Every module path that `DOCS.md` names exists under `src/`
  4. The `repository`, `bugs` and `homepage` links in `package.json` open `storytellingmap/storymap` pages, and `directories.example` names a folder that exists, or the field is gone
**Plans**: TBD

### 📋 v2.0 Monorepo (Planned)

**Milestone Goal:** The `storytellingmap` org moves into one open-source monorepo under `elfensky` (cockpit hub task).
**Requirements**: MONO-01, MONO-02, MONO-03
**Open facts (need Andrei)**:
- Which of the eight `storytellingmap` org repos go in; several of them are private
- Which open-source licence replaces `UNLICENSED`
- What happens to the private `storytellingmap` core npm package versus this repo
**Phases**: TBD — defined by `/gsd-new-milestone`

### 📋 v2.1 2022 review items (Planned)

**Milestone Goal:** The four items from the 2022 UX and code review land on the working, migrated codebase.
**Requirements**: REV-01, REV-02, REV-03, REV-04
**Depends on**: v2.0 (REV-01 needs a scoped npm name and the v2.0 licence)
**Phases**: TBD — defined by `/gsd-new-milestone`

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Health check on the 2022 versions | v1.1 | 0/TBD | Not started | - |
| 2. Automated check and defect fixes | v1.1 | 0/TBD | Not started | - |
| 3. Dependency refresh | v1.1 | 0/TBD | Not started | - |
| 4. Docs match the code | v1.1 | 0/TBD | Not started | - |
