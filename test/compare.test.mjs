// Unit tests for diffRatio (src/compare.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import pngjs from 'pngjs';

import { diffRatio } from '../src/compare.mjs';

const { PNG } = pngjs;

// Build a PNG buffer of the given size, filling every pixel with the
// supplied RGBA color (each component 0..255).
function solidPng(width, height, [r, g, b, a]) {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = a;
  }
  return PNG.sync.write(png);
}

const BLACK = [0, 0, 0, 255];
const WHITE = [255, 255, 255, 255];

test('identical images produce a ratio of exactly 0', () => {
  const a = solidPng(10, 10, BLACK);
  const b = solidPng(10, 10, BLACK);
  assert.equal(diffRatio(a, b), 0);
});

test('all-black vs all-white of the same size produces a high ratio', () => {
  const black = solidPng(10, 10, BLACK);
  const white = solidPng(10, 10, WHITE);
  const ratio = diffRatio(black, white);
  assert.ok(ratio > 0.9, `expected ratio > 0.9, got ${ratio}`);
});

test('images with different dimensions produce a ratio of exactly 1', () => {
  const a = solidPng(10, 10, BLACK);
  const b = solidPng(20, 20, BLACK);
  assert.equal(diffRatio(a, b), 1);
});

test('a single changed pixel produces a small non-zero ratio', () => {
  const base = new PNG({ width: 100, height: 100 });
  for (let i = 0; i < base.data.length; i += 4) {
    base.data[i] = 255;
    base.data[i + 1] = 255;
    base.data[i + 2] = 255;
    base.data[i + 3] = 255;
  }
  const a = PNG.sync.write(base);

  // Flip a single pixel to black.
  base.data[0] = 0;
  base.data[1] = 0;
  base.data[2] = 0;
  base.data[3] = 255;
  const b = PNG.sync.write(base);

  const ratio = diffRatio(a, b);
  assert.ok(ratio > 0, `expected ratio > 0, got ${ratio}`);
  assert.ok(ratio < 0.01, `expected ratio < 0.01, got ${ratio}`);
});
