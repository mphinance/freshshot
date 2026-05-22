# freshshot examples

Sample `freshshot` config files. Copy one to your project root as
`freshshot.config.json` and adjust it to your site.

## `minimal.config.json`

The smallest useful config: serves a local `site/` folder and captures a single
screenshot of the home page. Use it as a starting point when you just need one
shot and want to see freshshot working with the least possible setup.

## `multi-step.config.json`

Demonstrates the step language (`goto`, `fill`, `click`, `waitFor`) and the
multi-shot flow. The second shot has no `goto`, so it continues from the page
state the first shot left behind — fill a search box, submit, and capture the
results. Use this as a template for screenshotting interactive states.

## `external-url.config.json`

Uses `baseUrl` instead of `serve` to screenshot an already-deployed or
already-running site rather than a local folder. Use this when your site is
hosted somewhere else or runs on a dev server you start separately.

## `freshshot.config.json`

A complete, real-world config — the exact setup used by the Third Settler
board-game app. Shows retina capture (`deviceScaleFactor`), determinism
(`seedRandom`), a mobile viewport, the `eval` escape hatch, and a multi-step
game flow. Use it as a reference for the full feature set.
