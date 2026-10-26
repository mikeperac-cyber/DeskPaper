// Automated tests for calculateLuminance, applyThreshold, applyFloydSteinberg, and pack1BitBuffer
import assert from 'node:assert';
import {
  calculateLuminance,
  applyThreshold,
  applyFloydSteinberg,
  pack1BitBuffer
} from '../src/engine/dither.ts';

/**
 * Helper to create an ImageData-like object for testing.
 */
function createDummyImageData(width, height, pixelFillFn) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a = 255] = pixelFillFn(x, y);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
  return { width, height, data };
}

console.log('Running calculateLuminance & dither tests...');

// ==========================================
// 1. Luminance Formula Tests
// ==========================================
assert.strictEqual(calculateLuminance(0, 0, 0), 0);
console.log('✓ Pure black (0, 0, 0) luminance = 0');

assert.strictEqual(calculateLuminance(255, 255, 255), 255);
console.log('✓ Pure white (255, 255, 255) luminance = 255');

const redLuma = calculateLuminance(255, 0, 0);
assert.strictEqual(Math.round(redLuma * 1000) / 1000, 76.245);
console.log('✓ Pure red (255, 0, 0) luminance = ' + redLuma);

const greenLuma = calculateLuminance(0, 255, 0);
assert.strictEqual(Math.round(greenLuma * 1000) / 1000, 149.685);
console.log('✓ Pure green (0, 255, 0) luminance = ' + greenLuma);

const blueLuma = calculateLuminance(0, 0, 255);
assert.strictEqual(Math.round(blueLuma * 1000) / 1000, 29.07);
console.log('✓ Pure blue (0, 0, 255) luminance = ' + blueLuma);

// ==========================================
// 2. applyThreshold Tests
// ==========================================
{
  const imgData = createDummyImageData(2, 2, (x, y) => {
    // Top row white (255), bottom row black (0)
    return y === 0 ? [255, 255, 255] : [0, 0, 0];
  });
  const mono = applyThreshold(imgData, 128);
  assert.deepStrictEqual(mono, new Uint8Array([1, 1, 0, 0]));
  console.log('✓ applyThreshold correctly thresholds pixel values');
}

// ==========================================
// 3. applyFloydSteinberg - Uniform Colors Tests
// ==========================================
{
  // 3a. All Pure White (2x2) -> All 1s
  const whiteImg = createDummyImageData(2, 2, () => [255, 255, 255]);
  const monoWhite = applyFloydSteinberg(whiteImg);
  assert.deepStrictEqual(monoWhite, new Uint8Array([1, 1, 1, 1]));
  console.log('✓ applyFloydSteinberg: Pure white (2x2) produces all 1s');

  // 3b. All Pure Black (2x2) -> All 0s
  const blackImg = createDummyImageData(2, 2, () => [0, 0, 0]);
  const monoBlack = applyFloydSteinberg(blackImg);
  assert.deepStrictEqual(monoBlack, new Uint8Array([0, 0, 0, 0]));
  console.log('✓ applyFloydSteinberg: Pure black (2x2) produces all 0s');
}

// ==========================================
// 4. applyFloydSteinberg - Error Diffusion Step-by-Step Test
// ==========================================
{
  /**
   * 2x2 image with custom luma:
   * (0,0) = 200, (1,0) = 100
   * (0,1) = 100, (1,1) = 100
   *
   * Step 0: (0,0) = 200 >= 128 -> newVal = 255, mono[0] = 1
   *   error = 200 - 255 = -55
   *   diffuse to (1,0): 100 + (-55 * 7/16) = 100 - 24.0625 = 75.9375
   *   diffuse to (0,1): 100 + (-55 * 5/16) = 100 - 17.1875 = 82.8125
   *   diffuse to (1,1): 100 + (-55 * 1/16) = 100 - 3.4375 = 96.5625
   *
   * Step 1: (1,0) = 75.9375 < 128 -> newVal = 0, mono[1] = 0
   *   error = 75.9375 - 0 = +75.9375
   *   diffuse to (0,1) [x-1, y+1]: 82.8125 + (75.9375 * 3/16) = 82.8125 + 14.23828125 = 97.05078125
   *   diffuse to (1,1) [x, y+1]: 96.5625 + (75.9375 * 5/16) = 96.5625 + 23.73046875 = 120.29296875
   *
   * Step 2: (0,1) = 97.05078125 < 128 -> newVal = 0, mono[2] = 0
   *   error = 97.05078125
   *   diffuse to (1,1): 120.29296875 + (97.05078125 * 7/16) = 120.29296875 + 42.459716796875 = 162.752685546875
   *
   * Step 3: (1,1) = 162.752685546875 >= 128 -> newVal = 255, mono[3] = 1
   *
   * Expected output for [200, 100, 100, 100] luma is mono = [1, 0, 0, 1]
   */
  const imgData = createDummyImageData(2, 2, (x, y) => {
    if (x === 0 && y === 0) return [200, 200, 200];
    return [100, 100, 100];
  });

  const mono = applyFloydSteinberg(imgData);
  assert.deepStrictEqual(mono, new Uint8Array([1, 0, 0, 1]));
  console.log('✓ applyFloydSteinberg: 2x2 step-by-step error diffusion matches expected output [1, 0, 0, 1]');
}

// ==========================================
// 5. applyFloydSteinberg - Rectangular Grid & Edge Propagation
// ==========================================
{
  // 4x2 rectangular image
  const imgRect = createDummyImageData(4, 2, (x, y) => {
    // Fill top row with light gray (200), bottom row with dark gray (50)
    return y === 0 ? [200, 200, 200] : [50, 50, 50];
  });
  const monoRect = applyFloydSteinberg(imgRect);
  assert.strictEqual(monoRect.length, 8);
  // Ensure function runs without out-of-bounds errors on non-square dimensions
  console.log('✓ applyFloydSteinberg: Handles non-square (4x2) rectangular images');
}

// ==========================================
// 6. pack1BitBuffer Tests
// ==========================================
{
  const mono = new Uint8Array([1, 0, 1, 0, 1, 0, 1, 0]); // 8 pixels
  const packed = pack1BitBuffer(mono, 8, 1, false);
  // 10101000 = 0xAA (170)
  assert.strictEqual(packed.length, 1);
  assert.strictEqual(packed[0], 0xaa);
  console.log('✓ pack1BitBuffer packs 1-bit array into bytes MSB-first');
}

console.log('ALL DITHER TESTS PASSED SUCCESSFULLY!');
