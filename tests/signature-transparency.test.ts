import { describe, it, expect } from "vitest";
import { removeBackgroundFromImageData, type ImageDataLike } from "../src/lib/utils/signature";

describe("Signature Adaptive Background Removal", () => {
  it("preserves an already transparent PNG without modifying it", () => {
    const width = 20;
    const height = 20;
    const data = new Uint8ClampedArray(width * height * 4);

    // Populate mostly transparent pixels (alpha = 0)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 20;
      data[i + 1] = 20;
      data[i + 2] = 20;
      data[i + 3] = 0; // Transparent
    }

    // Add a small solid ink stroke in the center
    for (let y = 8; y <= 12; y++) {
      for (let x = 8; x <= 12; x++) {
        const idx = (y * width + x) * 4;
        data[idx + 3] = 255;
      }
    }

    const img: ImageDataLike = { data, width, height };
    const modified = removeBackgroundFromImageData(img);

    expect(modified).toBe(false);
  });

  it("removes shadowed, gray-blue indoor paper background while preserving dark pen ink", () => {
    const width = 60;
    const height = 40;
    const data = new Uint8ClampedArray(width * height * 4);

    // Create gray-blue shadowed paper (RGB: ~150, 160, 175)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 150;     // R
        data[idx + 1] = 160; // G
        data[idx + 2] = 175; // B
        data[idx + 3] = 255; // Fully opaque paper photo
      }
    }

    // Draw a dark blue handwritten pen stroke (RGB: 30, 35, 75, Lum ~38)
    for (let x = 10; x <= 50; x++) {
      const y = 20;
      const idx = (y * width + x) * 4;
      data[idx] = 30;
      data[idx + 1] = 35;
      data[idx + 2] = 75;
      data[idx + 3] = 255;
    }

    const img: ImageDataLike = { data, width, height };
    const modified = removeBackgroundFromImageData(img);

    expect(modified).toBe(true);

    // Verify paper pixels are now transparent (alpha = 0)
    const paperPixelIdx = (5 * width + 5) * 4;
    expect(img.data[paperPixelIdx + 3]).toBe(0);

    const cornerPixelIdx = (0 * width + 0) * 4;
    expect(img.data[cornerPixelIdx + 3]).toBe(0);

    // Verify pen stroke pixels remain visible with high alpha
    const strokePixelIdx = (20 * width + 30) * 4;
    expect(img.data[strokePixelIdx + 3]).toBeGreaterThan(200);

    // Verify dark ink contrast is preserved / deepened
    expect(img.data[strokePixelIdx]).toBeLessThanOrEqual(30);
    expect(img.data[strokePixelIdx + 1]).toBeLessThanOrEqual(35);
  });

  it("handles pure white paper scans smoothly", () => {
    const width = 50;
    const height = 30;
    const data = new Uint8ClampedArray(width * height * 4);

    // White paper: RGB: 255, 255, 255
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }

    // Black pen stroke
    for (let y = 10; y <= 20; y++) {
      const idx = (y * width + 25) * 4;
      data[idx] = 20;
      data[idx + 1] = 20;
      data[idx + 2] = 20;
      data[idx + 3] = 255;
    }

    const img: ImageDataLike = { data, width, height };
    const modified = removeBackgroundFromImageData(img);

    expect(modified).toBe(true);

    // White background is transparent
    expect(img.data[0 + 3]).toBe(0);

    // Ink stroke is opaque
    const strokeIdx = (15 * width + 25) * 4;
    expect(img.data[strokeIdx + 3]).toBe(255);
  });
});
