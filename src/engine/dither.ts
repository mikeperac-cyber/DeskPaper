/**
 * Monochrome dithering algorithms for 1-bit E-Paper displays
 */

/**
 * Calculates standard perceptual luminance from RGB color components.
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function applyThreshold(
  imageData: ImageData,
  threshold: number = 128
): Uint8Array {
  const { width, height, data } = imageData;
  const numPixels = width * height;
  const mono = new Uint8Array(numPixels);

  for (let i = 0, p = 0; p < numPixels; i += 4, p++) {
    const luma = calculateLuminance(data[i], data[i + 1], data[i + 2]);
    // In e-paper: 1 is white (background), 0 is black (ink)
    mono[p] = luma >= threshold ? 1 : 0;
  }

  return mono;
}

export function applyFloydSteinberg(imageData: ImageData): Uint8Array {
  const { width, height, data } = imageData;
  const numPixels = width * height;
  const mono = new Uint8Array(numPixels);

  // Floating-point luminance buffer for error diffusion
  const lumaBuffer = new Float32Array(numPixels);
  for (let i = 0, p = 0; p < numPixels; i += 4, p++) {
    lumaBuffer[p] = calculateLuminance(
      data[i],
      data[i + 1],
      data[i + 2]
    );
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldVal = lumaBuffer[idx];
      const newVal = oldVal >= 128 ? 255 : 0;
      mono[idx] = newVal === 255 ? 1 : 0;

      const error = oldVal - newVal;

      // Distribute error to neighboring pixels
      if (x + 1 < width) {
        lumaBuffer[idx + 1] += error * (7 / 16);
      }
      if (y + 1 < height) {
        if (x - 1 >= 0) {
          lumaBuffer[(y + 1) * width + (x - 1)] += error * (3 / 16);
        }
        lumaBuffer[(y + 1) * width + x] += error * (5 / 16);
        if (x + 1 < width) {
          lumaBuffer[(y + 1) * width + (x + 1)] += error * (1 / 16);
        }
      }
    }
  }

  return mono;
}

/**
 * Pack 1-bit array (1 = white, 0 = black) into byte array for Waveshare E-Paper.
 * Each byte contains 8 horizontal pixels, MSB first (bit 7 = leftmost pixel).
 */
export function pack1BitBuffer(
  mono: Uint8Array,
  width: number,
  height: number,
  invert: boolean = false
): Uint8Array {
  const rowBytes = Math.ceil(width / 8);
  const buffer = new Uint8Array(rowBytes * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x;
      let bit = mono[pixelIdx]; // 1 = white, 0 = black

      if (invert) {
        bit = bit === 1 ? 0 : 1;
      }

      const byteIdx = y * rowBytes + Math.floor(x / 8);
      const bitOffset = 7 - (x % 8);

      if (bit === 1) {
        buffer[byteIdx] |= 1 << bitOffset;
      }
    }
  }

  return buffer;
}
