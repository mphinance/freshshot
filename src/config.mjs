// Loads, defaults, and validates a freshshot config file.

import { readFileSync, existsSync } from 'fs';

const DEFAULTS = {
  serve: null,        // a local folder to serve, OR
  baseUrl: null,      // an existing URL to capture
  outDir: 'screenshots',
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  diffRatio: 0.0015,  // rewrite a shot only if >0.15% of pixels moved
  seedRandom: false,  // replace Math.random with a fixed seed
  settleMs: 200,      // pause after fonts load, before the screenshot
  shots: []
};

export function loadConfig(path) {
  if (!existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`Config is not valid JSON (${path}): ${e.message}`);
  }
  const cfg = { ...DEFAULTS, ...raw };
  // Deep-merge nested objects so a partial "viewport" keeps its defaults.
  cfg.viewport = { ...DEFAULTS.viewport, ...(raw.viewport || {}) };

  if (!cfg.serve && !cfg.baseUrl) {
    throw new Error('Config must set "serve" (a local folder) or "baseUrl" (a URL).');
  }
  if (!Array.isArray(cfg.shots) || cfg.shots.length === 0) {
    throw new Error('Config must define a non-empty "shots" array.');
  }
  cfg.shots.forEach((shot, i) => {
    if (!shot.name) throw new Error(`shots[${i}] is missing "name".`);
    if (!Array.isArray(shot.steps)) {
      throw new Error(`shot "${shot.name}" is missing a "steps" array.`);
    }
  });
  return cfg;
}
