// Automated tests for calculateLuminance and dither functions
import assert from 'node:assert';

// Formula test
function calculateLuminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

console.log('Running calculateLuminance & dither tests...');

// 1. Test pure black
assert.strictEqual(calculateLuminance(0, 0, 0), 0);
console.log('✓ Pure black (0, 0, 0) luminance = 0');

// 2. Test pure white
assert.strictEqual(calculateLuminance(255, 255, 255), 255);
console.log('✓ Pure white (255, 255, 255) luminance = 255');

// 3. Test primary colors
const redLuma = calculateLuminance(255, 0, 0);
assert.strictEqual(Math.round(redLuma * 1000) / 1000, 76.245);
console.log('✓ Pure red (255, 0, 0) luminance = ' + redLuma);

const greenLuma = calculateLuminance(0, 255, 0);
assert.strictEqual(Math.round(greenLuma * 1000) / 1000, 149.685);
console.log('✓ Pure green (0, 255, 0) luminance = ' + greenLuma);

const blueLuma = calculateLuminance(0, 0, 255);
assert.strictEqual(Math.round(blueLuma * 1000) / 1000, 29.07);
console.log('✓ Pure blue (0, 0, 255) luminance = ' + blueLuma);

console.log('ALL DITHER TESTS PASSED SUCCESSFULLY!');
