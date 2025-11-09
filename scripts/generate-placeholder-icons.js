#!/usr/bin/env node

/**
 * Generate placeholder PWA icons
 * These are simple colored squares to allow the app to build
 * Replace with real icons before production!
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

// Create a simple SVG icon generator
function generateSVG(size, text) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#FF4B00"/>
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="${size / 8}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="middle"
  >
    ${text}
  </text>
</svg>`;
}

// Generate icons
const icons = [
  { name: 'pwa-64x64.png', size: 64, text: 'K' },
  { name: 'pwa-192x192.png', size: 192, text: 'K' },
  { name: 'pwa-512x512.png', size: 512, text: 'K' },
  { name: 'maskable-icon-512x512.png', size: 512, text: 'K' },
  { name: 'apple-touch-icon.png', size: 180, text: 'K' },
];

// For development, we'll create SVG versions
// Users should replace with actual PNGs
icons.forEach(icon => {
  const svgContent = generateSVG(icon.size, icon.text);
  const svgPath = path.join(publicDir, icon.name.replace('.png', '.svg'));
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✓ Generated placeholder: ${icon.name.replace('.png', '.svg')}`);
});

// Create a simple favicon.ico placeholder
const faviconSVG = generateSVG(32, 'K');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG);
console.log('✓ Generated placeholder: favicon.svg');

console.log('\n⚠️  IMPORTANT: These are placeholder icons!');
console.log('   Replace with real icons before production.');
console.log('   See public/ICONS_README.md for instructions.\n');
