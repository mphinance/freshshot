# 📸 freshshot

**Keep your README screenshots fresh.** Capture them, compare them *perceptually*, and commit only the ones that truly changed.

![license](https://img.shields.io/badge/license-MIT-9f8aff)
![node](https://img.shields.io/badge/node-%E2%89%A518-46c98b)
![status](https://img.shields.io/badge/status-v0.1-ffb259)

---

## The problem

README screenshots rot. You add one the day you launch; the UI moves a week later; now your README quietly lies to everyone who lands on it. A stale screenshot makes a project look abandoned.

The obvious fix is to regenerate them in CI. But naive screenshot automation commits a **new image on every run** — fonts anti-alias differently, animations land on different frames, a random value nudges a pixel. Your git history fills with binary noise and the diffs become worthless. So most people just... don't.

## How freshshot fixes it

Two ideas, working together:

**1. Determinism.** freshshot serves your site locally, optionally seeds `Math.random`, freezes animations, and waits for web fonts. The same UI renders the same way every run.

**2. Perceptual diff.** A freshly captured shot replaces the committed one *only* if more than a threshold of pixels **genuinely** moved. Sub-pixel anti-aliasing and blur jitter is ignored. Real changes are not.

Run it in CI on every change and it commits a screenshot **only when the UI actually changed.** No noise. The README stays honest on its own.

## Quick start

```bash
npm install --save-dev freshshot
npx playwright install chromium
```

Add a `freshshot.config.json` at your project root:

```json
{
  "serve": "site",
  "outDir": "screenshots",
  "shots": [
    { "name": "home", "steps": [ { "goto": "/index.html" } ] }
  ]
}
```

Run it:

```bash
npx freshshot
```

```
freshshot: 1 shot(s) from freshshot.config.json
  = home  unchanged (0.000%)

No changes - every screenshot is already current.
```

freshshot captures each shot, compares it to the committed PNG, and rewrites only what meaningfully changed. Embed the results in your README with plain `<img>` tags and you're done.

## Configuration

A `freshshot.config.json` has a few top-level keys and a list of `shots`.

**Top level**

- `serve` — a local folder to serve and screenshot, **or**
- `baseUrl` — an already-running URL to screenshot instead
- `outDir` — where screenshots are written (default `screenshots`)
- `viewport` — `{ "width", "height" }` (default `1280x800`)
- `deviceScaleFactor` — e.g. `2` for retina-crisp images (default `1`)
- `diffRatio` — how much must change before a rewrite (default `0.0015`, i.e. 0.15%)
- `seedRandom` — replace `Math.random` with a fixed seed for determinism (default `false`)
- `settleMs` — pause after fonts load, before capture (default `200`)
- `shots` — the screenshots to take

**Each shot**

- `name` — output filename (`<name>.png`)
- `steps` — actions that drive the page into the state you want
- `screenshot` — Playwright screenshot options, e.g. `{ "animations": "disabled" }`

**Steps**

- `{ "goto": "/path" }`
- `{ "click": "<selector>", "times": 1 }`
- `{ "fill": "<selector>", "value": "text" }`
- `{ "waitFor": "<selector>" }`
- `{ "wait": 500 }` — milliseconds
- `{ "eval": "<javascript>" }` — escape hatch for app-specific tweaks (force an element visible, pause an animation, and so on)

Shots run **in order on one browser session**, so a shot whose steps don't start with `goto` simply continues from the previous shot's state. That makes multi-step flows — open a menu, play a turn, reach a result screen — easy to capture.

See [`examples/freshshot.config.json`](examples/freshshot.config.json) for a complete, real-world config.

## In CI

```yaml
name: Screenshots
on:
  push:
    branches: [main]
    paths: ['site/**']
permissions:
  contents: write
jobs:
  freshshot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: mphinance/freshshot@v1
```

The action captures, perceptual-diffs, and commits back **only** the screenshots that changed. An unchanged UI produces zero commits.

## `--check` mode

```bash
npx freshshot --check
```

Captures and compares but writes nothing; exits non-zero if any screenshot is stale. Useful as a pull-request gate.

## Why "perceptual"?

Byte-for-byte screenshot comparison is a trap: two visually **identical** captures routinely differ at the byte level, because anti-aliasing and filter effects render with tiny variations. Compare bytes, and you commit noise forever. freshshot compares *pixels* with [pixelmatch](https://github.com/mapbox/pixelmatch) — sub-pixel jitter is filtered out, genuine changes are caught. That single decision is what makes screenshot automation actually usable.

## Origin

freshshot was extracted from [Third Settler](https://github.com/mphinance/third-settler), a board-game app whose README screenshots had to stay honest while the UI changed by the hour. The pattern worked well enough that it wanted to be its own tool.

## License

MIT — see [LICENSE](LICENSE).
