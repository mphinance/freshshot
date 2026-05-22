// Perceptual image comparison. Returns the fraction of pixels that
// genuinely changed, ignoring the sub-pixel anti-aliasing and filter
// jitter that makes byte-for-byte screenshot comparison useless.

import pixelmatch from 'pixelmatch';
import pngjs from 'pngjs';

const { PNG } = pngjs;

// Fraction (0..1) of pixels that meaningfully differ between two PNG buffers.
// Differently sized images count as fully different.
export function diffRatio(pngBufferA, pngBufferB) {
  const a = PNG.sync.read(pngBufferA);
  const b = PNG.sync.read(pngBufferB);
  if (a.width !== b.width || a.height !== b.height) return 1;
  const moved = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 });
  return moved / (a.width * a.height);
}
