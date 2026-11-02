# AGENTS.md — storymap

`storymap` is a browser JavaScript library for scroll-driven animated story maps. It builds a 3D city in three.js
from an OpenStreetMap GeoJSON export, lets an author draw a path along the roads (`setup()`), and plays that path
back on scroll while the camera follows it (`start()`). It began as Andrei's 2022 Bachelorproef. Plain JavaScript ES
modules, browser-only, no build step. Dependencies: `three` and `geolib`.

## Install and test

- Install: `npm install`. `package-lock.json` is gitignored.
- Test: `npm test`. It is still the npm placeholder and exits 1. Phase 2 of `.planning/ROADMAP.md` replaces it.
- Format: Prettier config in `.prettierrc` (tabs, width 4, trailing commas). No script runs it.
- Use in an app (Vite, install from GitHub, the HTML the library needs): `INSTALLATION.md`.

## Docs

- `README.md`: what it does, the Overpass Turbo query for city data, configuration, `setup()` and `start()`.
- `INSTALLATION.md`: setup in a consumer app.
- `DOCS.md`: one line per module.
- `ANSWERS.md`: the Bachelorproef research questions with answers. `SOURCES.md`: references.
- `.planning/`: GSD. `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, and the codebase map in `.planning/codebase/`.

## Life cockpit

Tracked in the life-cockpit vault under `#personal` (tracker: `storytellingmap/storymap`). The cockpit is the
control plane (what to work on); this repo is where the work happens. Report progress by
opening/closing issues and PRs as usual — the cockpit pulls from the tracker on its next
`/sync`. Nothing to update in the vault; don't mirror cockpit state (milestones, due dates) here.
GSD projects: after `/gsd-new-project`, run `/cockpit-gsd-profile` once in this repo before planning the first slice.
Roadmap: this repo owns its roadmap. `.planning/ROADMAP.md` (GSD) is the one roadmap file here; no second
roadmap file lives in this repo. A session in this repo publishes it to projects.static.lav.ren through
keijiban (`elfensky/keijiban`); the vault keeps the enrollment only, never a copy of the plan.
