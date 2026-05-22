// The capture engine: drive each configured shot through Playwright, then
// keep the result only if it differs meaningfully from the committed one.

import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { serve } from './server.mjs';
import { diffRatio } from './compare.mjs';

// mulberry32 - a seeded PRNG injected to replace Math.random, so anything
// random in the page (generated content, dice, confetti) renders the same
// way every run.
const SEED_SCRIPT = `(function () {
  var s = 0x9e3779b9;
  Math.random = function () {
    s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();`;

async function runStep(page, step, base) {
  if (step.goto !== undefined) {
    await page.goto(base + step.goto, { waitUntil: 'networkidle' });
  } else if (step.click !== undefined) {
    const times = step.times || 1;
    for (let i = 0; i < times; i++) await page.click(step.click);
  } else if (step.fill !== undefined) {
    await page.fill(step.fill, String(step.value ?? ''));
  } else if (step.waitFor !== undefined) {
    await page.waitForSelector(step.waitFor, { state: step.state || 'attached' });
  } else if (step.wait !== undefined) {
    await page.waitForTimeout(step.wait);
  } else if (step.eval !== undefined) {
    await page.evaluate(step.eval);
  } else {
    throw new Error(`Unknown step: ${JSON.stringify(step)}`);
  }
}

function decide(name, dest, buf, threshold, write) {
  if (!existsSync(dest)) {
    if (write) writeFileSync(dest, buf);
    return { name, status: 'new', ratio: 1 };
  }
  const ratio = diffRatio(readFileSync(dest), buf);
  if (ratio > threshold) {
    if (write) writeFileSync(dest, buf);
    return { name, status: 'changed', ratio };
  }
  return { name, status: 'unchanged', ratio };
}

// Runs every shot in the config. With { check: true } nothing is written;
// the returned statuses just report what would change.
export async function capture(cfg, { check = false } = {}) {
  mkdirSync(cfg.outDir, { recursive: true });

  let base = cfg.baseUrl;
  let server = null;
  if (cfg.serve) {
    server = await serve(cfg.serve);
    base = server.url;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: cfg.viewport,
    deviceScaleFactor: cfg.deviceScaleFactor
  });
  if (cfg.seedRandom) await page.addInitScript(SEED_SCRIPT);

  const results = [];
  try {
    for (const shot of cfg.shots) {
      try {
        for (const step of shot.steps) await runStep(page, step, base);
        // Let any web fonts finish, then settle, for a stable capture.
        await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
        await page.waitForTimeout(cfg.settleMs);
        const buf = await page.screenshot(shot.screenshot || {});
        const dest = join(cfg.outDir, `${shot.name}.png`);
        results.push(decide(shot.name, dest, buf, cfg.diffRatio, !check));
      } catch (e) {
        throw new Error(`shot "${shot.name}" failed: ${e.message}`);
      }
    }
  } finally {
    await browser.close();
    if (server) server.close();
  }
  return results;
}
