import tesseract from 'node-tesseract-ocr';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';

// PSM 11 = "sparse text — find as much as possible, no particular order".
// Better than PSM 6 for labels where text appears in multiple discrete
// blocks at varying sizes (brand name vs warning band, etc).
const TESS_CONFIG = {
  lang: 'eng',
  oem: 1,
  psm: 11,
};

// Target dimension for OCR. Small label photos benefit from being upscaled;
// huge photos benefit from being scaled down.
const TARGET_LONG_EDGE = 2400;
const MIN_LONG_EDGE = 1800;

async function preprocess(imagePath, suffix, transforms) {
  const dir = path.dirname(imagePath);
  const ext = path.extname(imagePath);
  const base = path.basename(imagePath, ext);
  const out = path.join(dir, `${base}-${suffix}.png`);
  let p = sharp(imagePath).rotate(); // honour EXIF orientation
  const meta = await sharp(imagePath).metadata();
  const longEdge = Math.max(meta.width || 0, meta.height || 0);
  if (longEdge > TARGET_LONG_EDGE) {
    p = p.resize({ width: TARGET_LONG_EDGE, height: TARGET_LONG_EDGE, fit: 'inside' });
  } else if (longEdge < MIN_LONG_EDGE) {
    const scale = MIN_LONG_EDGE / longEdge;
    p = p.resize({ width: Math.round((meta.width || 1) * scale), height: Math.round((meta.height || 1) * scale) });
  }
  await transforms(p).png().toFile(out);
  return out;
}

export async function extractTextFromImage(imagePath) {
  // Pass 1: greyscale + normalize + sharpen — best for light-on-dark and
  // dark-on-light text in well-lit regions.
  const normalPath = await preprocess(imagePath, 'ocr-normal', (p) =>
    p.greyscale().normalize().sharpen({ sigma: 1.0 }),
  );

  // Pass 2: invert + greyscale + normalize — catches white text on a dark
  // band (e.g. the Government Warning) which Tesseract often misses
  // otherwise.
  const invertedPath = await preprocess(imagePath, 'ocr-inverted', (p) =>
    p.greyscale().negate().normalize().sharpen({ sigma: 1.0 }),
  );

  const start = Date.now();
  const [textNormal, textInverted] = await Promise.all([
    tesseract.recognize(normalPath, TESS_CONFIG).catch(() => ''),
    tesseract.recognize(invertedPath, TESS_CONFIG).catch(() => ''),
  ]);
  const ms = Date.now() - start;

  // Clean up scratch files.
  fs.unlink(normalPath).catch(() => {});
  fs.unlink(invertedPath).catch(() => {});

  // Merge both passes. We keep them tagged so the LLM can reason about
  // both. Duplicates are fine — the LLM is good at deduping.
  const merged = [
    '=== Pass 1 (normal) ===',
    textNormal.trim(),
    '',
    '=== Pass 2 (inverted, recovers white-on-dark text) ===',
    textInverted.trim(),
  ].join('\n');

  return { text: merged, latency_ms: ms };
}
