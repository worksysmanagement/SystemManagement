/**
 * Adaptive background removal for handwritten signatures.
 * Automatically adapts to varying lighting, shadowed paper, phone photo captures,
 * ballpoint pen (blue, black) ink, and preserves existing transparent PNGs.
 */

export interface ImageDataLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Removes background from an image in-place.
 * Returns true if changes were applied, or false if image was already transparent.
 */
export function removeBackgroundFromImageData(imgData: ImageDataLike): boolean {
  const d = imgData.data;
  const width = imgData.width;
  const height = imgData.height;
  const totalPixels = width * height;

  if (totalPixels === 0) return false;

  // 1. Check if the image is already transparent
  let transparentCount = 0;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] < 50) {
      transparentCount++;
    }
  }
  // If more than 15% of pixels are already transparent, preserve as is
  if (transparentCount > totalPixels * 0.15) {
    return false;
  }

  // 2. Compute luminance map
  const gray = new Float32Array(totalPixels);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    // Perceptual luminance formula
    gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }

  // 3. Grid-based local paper background estimation
  const cellSize = Math.max(16, Math.min(32, Math.round(Math.min(width, height) / 8)));
  const gridW = Math.max(2, Math.ceil(width / cellSize));
  const gridH = Math.max(2, Math.ceil(height / cellSize));
  const cellW = width / gridW;
  const cellH = height / gridH;

  const gridBg: number[][] = [];
  let globalMaxBg = 0;

  for (let gy = 0; gy < gridH; gy++) {
    gridBg[gy] = [];
    const y0 = Math.floor(gy * cellH);
    const y1 = Math.min(height, Math.floor((gy + 1) * cellH));

    for (let gx = 0; gx < gridW; gx++) {
      const x0 = Math.floor(gx * cellW);
      const x1 = Math.min(width, Math.floor((gx + 1) * cellW));

      // Collect luminance samples in cell
      const samples: number[] = [];
      const step = (x1 - x0) * (y1 - y0) > 400 ? 2 : 1;
      for (let y = y0; y < y1; y += step) {
        const rowOffset = y * width;
        for (let x = x0; x < x1; x += step) {
          samples.push(gray[rowOffset + x]);
        }
      }

      if (samples.length > 0) {
        samples.sort((a, b) => a - b);
        // 88th percentile represents the local paper surface
        const p88 = samples[Math.floor(samples.length * 0.88)];
        gridBg[gy][gx] = p88;
        if (p88 > globalMaxBg) globalMaxBg = p88;
      } else {
        gridBg[gy][gx] = 255;
      }
    }
  }

  // Paper consistency floor: no cell paper estimate should drop below 70% of peak paper brightness
  const minAllowedPaper = globalMaxBg * 0.70;
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      if (gridBg[gy][gx] < minAllowedPaper) {
        gridBg[gy][gx] = minAllowedPaper;
      }
    }
  }

  // 4. Threshold parameters
  // tLow: below this contrast difference, pixel is pure paper / watermark / reverse bleed -> alpha = 0
  // tHigh: above this, pixel is solid ink -> alpha = 255
  const tLow = 28.0;
  const tHigh = 56.0;
  const tSpan = tHigh - tLow;

  // 5. Apply adaptive thresholding with bilinear interpolation and antialiasing
  for (let y = 0; y < height; y++) {
    const v = (y / cellH) - 0.5;
    const y0 = Math.max(0, Math.min(gridH - 1, Math.floor(v)));
    const y1 = Math.max(0, Math.min(gridH - 1, y0 + 1));
    const sy = Math.max(0, Math.min(1, v - Math.floor(v)));

    const rowOffset = y * width;

    for (let x = 0; x < width; x++) {
      const u = (x / cellW) - 0.5;
      const x0 = Math.max(0, Math.min(gridW - 1, Math.floor(u)));
      const x1 = Math.max(0, Math.min(gridW - 1, x0 + 1));
      const sx = Math.max(0, Math.min(1, u - Math.floor(u)));

      const top = gridBg[y0][x0] * (1 - sx) + gridBg[y0][x1] * sx;
      const bot = gridBg[y1][x0] * (1 - sx) + gridBg[y1][x1] * sx;
      const localBg = top * (1 - sy) + bot * sy;

      const pIdx = rowOffset + x;
      const lum = gray[pIdx];
      const diff = localBg - lum;

      const dIdx = pIdx * 4;

      if (diff > tLow) {
        // Pixel is ink or ink edge
        const ratio = Math.min(1.0, (diff - tLow) / tSpan);
        const alpha = Math.round(ratio * 255);
        d[dIdx + 3] = alpha;

        // Enhance ink contrast & depth slightly to offset paper shadow
        const darken = 1.0 - 0.25 * ratio;
        d[dIdx] = Math.max(0, Math.round(d[dIdx] * darken));
        d[dIdx + 1] = Math.max(0, Math.round(d[dIdx + 1] * darken));
        d[dIdx + 2] = Math.max(0, Math.round(d[dIdx + 2] * darken));
      } else {
        // Paper background / watermark / reverse-side bleed -> completely transparent
        d[dIdx + 3] = 0;
      }
    }
  }

  return true;
}

/**
 * Detaches and removes background from any uploaded signature dataUrl.
 * Supports raster photos (PNG, JPEG, WebP) with shadows or dim lighting.
 */
export function processTransparentImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 1000;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const modified = removeBackgroundFromImageData(imgData);
        if (modified) {
          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          // Already transparent
          resolve(dataUrl);
        }
      } catch (err) {
        console.error("Error processing transparent signature:", err);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
