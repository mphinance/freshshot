// Unit tests for loadConfig (src/config.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadConfig } from '../src/config.mjs';

// A fresh temp dir for each fixture write, cleaned up at the end.
const tmpDirs = [];

function fixture(name, contents) {
  const dir = mkdtempSync(join(tmpdir(), 'freshshot-test-'));
  tmpDirs.push(dir);
  const filePath = join(dir, name);
  const data = typeof contents === 'string' ? contents : JSON.stringify(contents);
  writeFileSync(filePath, data, 'utf8');
  return filePath;
}

test.after(() => {
  for (const dir of tmpDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

const VALID_SHOT = { name: 'home', steps: [] };

test('a valid config loads and applies defaults', () => {
  const path = fixture('config.json', {
    baseUrl: 'https://example.com',
    shots: [VALID_SHOT]
  });
  const cfg = loadConfig(path);
  assert.equal(cfg.outDir, 'screenshots');
  assert.equal(cfg.diffRatio, 0.0015);
  assert.equal(cfg.deviceScaleFactor, 1);
  assert.equal(cfg.seedRandom, false);
  assert.equal(cfg.settleMs, 200);
  assert.deepEqual(cfg.viewport, { width: 1280, height: 800 });
  assert.equal(cfg.baseUrl, 'https://example.com');
});

test('a nonexistent path throws', () => {
  const missing = join(tmpdir(), 'freshshot-does-not-exist-xyz.json');
  assert.throws(() => loadConfig(missing), /not found/);
});

test('invalid JSON throws', () => {
  const path = fixture('bad.json', '{ not valid json');
  assert.throws(() => loadConfig(path), /not valid JSON/);
});

test('a config with neither serve nor baseUrl throws', () => {
  const path = fixture('config.json', {
    shots: [VALID_SHOT]
  });
  assert.throws(() => loadConfig(path), /"serve".*"baseUrl"/);
});

test('a config with an empty shots array throws', () => {
  const path = fixture('config.json', {
    baseUrl: 'https://example.com',
    shots: []
  });
  assert.throws(() => loadConfig(path), /non-empty "shots"/);
});

test('a shot missing "name" throws', () => {
  const path = fixture('config.json', {
    baseUrl: 'https://example.com',
    shots: [{ steps: [] }]
  });
  assert.throws(() => loadConfig(path), /missing "name"/);
});

test('a shot missing "steps" throws', () => {
  const path = fixture('config.json', {
    baseUrl: 'https://example.com',
    shots: [{ name: 'home' }]
  });
  assert.throws(() => loadConfig(path), /missing a "steps" array/);
});
