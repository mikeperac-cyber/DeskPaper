import assert from "node:assert";
import { applyThreshold } from "../src/engine/dither.ts";

console.log("Running applyThreshold unit tests...");

const createImg = (r, g, b) => ({ width: 1, height: 1, data: new Uint8ClampedArray([r, g, b, 255]) });

// 1. Default threshold (128) - White pixel
assert.strictEqual(applyThreshold(createImg(255, 255, 255))[0], 1, "White pixel -> 1");

// 2. Default threshold (128) - Black pixel
assert.strictEqual(applyThreshold(createImg(0, 0, 0))[0], 0, "Black pixel -> 0");

// 3. Custom threshold
const grayImg = createImg(100, 100, 100);
assert.strictEqual(applyThreshold(grayImg, 128)[0], 0, "Luma 100 < 128 -> 0");
assert.strictEqual(applyThreshold(grayImg, 50)[0], 1, "Luma 100 >= 50 -> 1");

console.log("✓ All applyThreshold tests passed!");
