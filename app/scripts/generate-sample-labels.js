// Generate clean synthetic label PNGs for OCR testing.
// Each label produces:
//   - <name>.png            — the rendered label
//   - <name>.expected.json  — ground-truth fields for comparison
//
// Usage: node scripts/generate-sample-labels.js

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'sample-labels');

const CANONICAL_WARNING =
  'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.';

// ----- helpers -----

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const word of words) {
    if ((cur + ' ' + word).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = (cur + ' ' + word).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ----- SVG label template -----

function svgLabel({
  brand,
  classType,
  abv,
  proof,
  netContents,
  producer,
  address,
  countryOfOrigin,
  warning, // null to omit the band entirely
  accentColor = '#3c2415',
}) {
  const w = 900;
  const h = 1200;

  const warningLines = warning ? wrap(warning, 70) : [];
  const lineH = 22;
  const warningBoxH = warning ? Math.max(150, warningLines.length * lineH + 30) : 0;
  const warningY = h - warningBoxH - 50;

  const warningTspans = warningLines
    .map(
      (line, i) =>
        `<tspan x="${w / 2}" dy="${i === 0 ? 26 : lineH}" text-anchor="middle">${escapeXml(line)}</tspan>`,
    )
    .join('');

  // Stack the info block from the bottom up so it never overlaps the
  // warning band, regardless of how many lines the warning wraps to.
  const blockBottomY = (warning ? warningY : h - 80) - 30;
  let cursor = blockBottomY;
  const addressY = cursor;            cursor -= 28;
  const producerY = cursor;           cursor -= 44;
  const netY = cursor;                cursor -= 40;
  const proofY = proof ? cursor : 0;  if (proof) cursor -= 36;
  const abvY = cursor;                cursor -= 50;
  const countryY = countryOfOrigin ? cursor : 0;

  const countryLine = countryOfOrigin
    ? `<text x="${w / 2}" y="${countryY}" font-family="Helvetica, sans-serif" font-size="16" fill="${accentColor}" text-anchor="middle" font-style="italic">Product of ${escapeXml(countryOfOrigin)}</text>`
    : '';

  const proofLine = proof
    ? `<text x="${w / 2}" y="${proofY}" font-family="Helvetica, sans-serif" font-size="22" fill="${accentColor}" text-anchor="middle">${escapeXml(proof)}</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#fbf6e8"/>
  <rect x="35" y="35" width="${w - 70}" height="${h - 70}" fill="none" stroke="${accentColor}" stroke-width="4"/>
  <rect x="55" y="55" width="${w - 110}" height="${h - 110}" fill="none" stroke="${accentColor}" stroke-width="1"/>

  <text x="${w / 2}" y="170" font-family="Georgia, serif" font-size="46" font-weight="bold" fill="${accentColor}" text-anchor="middle" letter-spacing="4">${escapeXml(brand)}</text>
  <line x1="220" y1="200" x2="${w - 220}" y2="200" stroke="${accentColor}" stroke-width="1.5"/>

  <text x="${w / 2}" y="290" font-family="Georgia, serif" font-size="30" fill="${accentColor}" text-anchor="middle">${escapeXml(classType)}</text>

  ${countryLine}
  <text x="${w / 2}" y="${abvY}" font-family="Helvetica, sans-serif" font-size="28" font-weight="bold" fill="${accentColor}" text-anchor="middle">${escapeXml(abv)}</text>
  ${proofLine}
  <text x="${w / 2}" y="${netY}" font-family="Helvetica, sans-serif" font-size="26" fill="${accentColor}" text-anchor="middle">${escapeXml(netContents)}</text>
  <text x="${w / 2}" y="${producerY}" font-family="Helvetica, sans-serif" font-size="18" fill="${accentColor}" text-anchor="middle">${escapeXml(producer)}</text>
  <text x="${w / 2}" y="${addressY}" font-family="Helvetica, sans-serif" font-size="18" fill="${accentColor}" text-anchor="middle">${escapeXml(address)}</text>

  ${warning ? `<rect x="50" y="${warningY}" width="${w - 100}" height="${warningBoxH}" fill="#111111"/>
  <text font-family="Helvetica, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" y="${warningY}">${warningTspans}</text>` : ''}
</svg>`;
}

// ----- the catalogue -----

const labels = [
  {
    file: 'spirits_bourbon_clean.png',
    description: 'Spirits — bourbon, all fields present, canonical warning. Happy-path test.',
    svg: {
      brand: 'OLD TOM DISTILLERY',
      classType: 'Kentucky Straight Bourbon Whiskey',
      abv: '45% Alc./Vol.',
      proof: '90 Proof',
      netContents: '750 mL',
      producer: 'Distilled and Bottled by Old Tom Distillery',
      address: 'Bardstown, Kentucky, USA',
      warning: CANONICAL_WARNING,
    },
    expected: {
      brand_name: 'OLD TOM DISTILLERY',
      class_type: 'Kentucky Straight Bourbon Whiskey',
      alcohol_content_abv: '45% Alc./Vol.',
      alcohol_content_proof: '90 Proof',
      net_contents: '750 mL',
      producer_name: 'Old Tom Distillery',
      producer_address: 'Bardstown, Kentucky, USA',
      government_warning_present: true,
      government_warning_text_exact_match: true,
      government_warning_prefix_all_caps: true,
      beverage_type: 'spirits',
    },
  },

  {
    file: 'wine_cabernet_clean.png',
    description: 'Wine — Napa cab, all fields present, canonical warning.',
    svg: {
      brand: 'VALLEY OAKS VINEYARD',
      classType: 'Napa Valley Cabernet Sauvignon',
      abv: '13.5% Alc./Vol.',
      netContents: '750 mL',
      producer: 'Produced and Bottled by Valley Oaks Vineyard',
      address: 'Napa, California, USA',
      warning: CANONICAL_WARNING,
      accentColor: '#5a1a2b',
    },
    expected: {
      brand_name: 'VALLEY OAKS VINEYARD',
      class_type: 'Napa Valley Cabernet Sauvignon',
      alcohol_content_abv: '13.5% Alc./Vol.',
      alcohol_content_proof: null,
      net_contents: '750 mL',
      producer_name: 'Valley Oaks Vineyard',
      producer_address: 'Napa, California, USA',
      government_warning_present: true,
      government_warning_text_exact_match: true,
      government_warning_prefix_all_caps: true,
      beverage_type: 'wine',
    },
  },

  {
    file: 'beer_ipa_clean.png',
    description: 'Beer — American IPA, all fields present, canonical warning.',
    svg: {
      brand: 'NORTHERN PINES BREWING',
      classType: 'American India Pale Ale',
      abv: '6.8% Alc./Vol.',
      netContents: '12 FL OZ (355 mL)',
      producer: 'Brewed and Bottled by Northern Pines Brewing Co.',
      address: 'Portland, Oregon, USA',
      warning: CANONICAL_WARNING,
      accentColor: '#1a3a2b',
    },
    expected: {
      brand_name: 'NORTHERN PINES BREWING',
      class_type: 'American India Pale Ale',
      alcohol_content_abv: '6.8% Alc./Vol.',
      alcohol_content_proof: null,
      net_contents: '12 FL OZ (355 mL)',
      producer_name: 'Northern Pines Brewing Co.',
      producer_address: 'Portland, Oregon, USA',
      government_warning_present: true,
      government_warning_text_exact_match: true,
      government_warning_prefix_all_caps: true,
      beverage_type: 'beer',
    },
  },

  {
    file: 'spirits_bourbon_bad_warning.png',
    description:
      'Spirits — same as bourbon_clean but warning has Jenny\'s case violation: "Government Warning" in title case, not all caps. Must FAIL the compliance check.',
    svg: {
      brand: 'OLD TOM DISTILLERY',
      classType: 'Kentucky Straight Bourbon Whiskey',
      abv: '45% Alc./Vol.',
      proof: '90 Proof',
      netContents: '750 mL',
      producer: 'Distilled and Bottled by Old Tom Distillery',
      address: 'Bardstown, Kentucky, USA',
      warning: CANONICAL_WARNING.replace(
        'GOVERNMENT WARNING:',
        'Government Warning:',
      ),
    },
    expected: {
      brand_name: 'OLD TOM DISTILLERY',
      class_type: 'Kentucky Straight Bourbon Whiskey',
      alcohol_content_abv: '45% Alc./Vol.',
      alcohol_content_proof: '90 Proof',
      net_contents: '750 mL',
      producer_name: 'Old Tom Distillery',
      producer_address: 'Bardstown, Kentucky, USA',
      government_warning_present: true,
      government_warning_text_exact_match: false,
      government_warning_prefix_all_caps: false,
      beverage_type: 'spirits',
    },
  },

  {
    file: 'spirits_bourbon_no_warning.png',
    description:
      'Spirits — bourbon with NO warning band at all. Must FAIL the compliance check.',
    svg: {
      brand: 'OLD TOM DISTILLERY',
      classType: 'Kentucky Straight Bourbon Whiskey',
      abv: '45% Alc./Vol.',
      proof: '90 Proof',
      netContents: '750 mL',
      producer: 'Distilled and Bottled by Old Tom Distillery',
      address: 'Bardstown, Kentucky, USA',
      warning: null,
    },
    expected: {
      brand_name: 'OLD TOM DISTILLERY',
      class_type: 'Kentucky Straight Bourbon Whiskey',
      alcohol_content_abv: '45% Alc./Vol.',
      alcohol_content_proof: '90 Proof',
      net_contents: '750 mL',
      producer_name: 'Old Tom Distillery',
      producer_address: 'Bardstown, Kentucky, USA',
      government_warning_present: false,
      government_warning_text_exact_match: false,
      government_warning_prefix_all_caps: false,
      beverage_type: 'spirits',
    },
  },
];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const label of labels) {
    const svg = svgLabel(label.svg);
    const pngPath = path.join(OUT_DIR, label.file);
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
    const jsonPath = pngPath.replace(/\.png$/, '.expected.json');
    await fs.writeFile(
      jsonPath,
      JSON.stringify({ description: label.description, expected: label.expected }, null, 2),
    );
    console.log(`✓ ${label.file}`);
  }
  console.log(`\nWrote ${labels.length} labels + sidecar JSON to:\n  ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
