import type { PreprocessConfig, Matrix2D } from '../types/cnn';

/**
 * Calculates optimal threshold via Otsu's Between-Class Variance Maximization
 */
export function computeOtsuThreshold(imageData: ImageData): number {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  if (totalPixels === 0) return 128;

  // 1. Build histogram of grayscale intensities
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    histogram[Math.min(255, Math.max(0, gray))]++;
  }

  // 2. Compute total mean intensity
  let totalMean = 0;
  for (let t = 0; t < 256; t++) {
    totalMean += t * (histogram[t] / totalPixels);
  }

  let weightBackground = 0;
  let sumBackground = 0;
  let maxVariance = -1;
  let bestThreshold = 128;

  // 3. Iterate through all possible thresholds [0, 255]
  for (let t = 0; t < 256; t++) {
    const p = histogram[t] / totalPixels;
    weightBackground += p;
    if (weightBackground === 0) continue;

    const weightForeground = 1.0 - weightBackground;
    if (weightForeground <= 0) break;

    sumBackground += t * p;

    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (totalMean - sumBackground) / weightForeground;

    // Between-class variance: w0 * w1 * (mu0 - mu1)^2
    const variance = weightBackground * weightForeground * Math.pow(meanBackground - meanForeground, 2);

    if (variance > maxVariance) {
      maxVariance = variance;
      bestThreshold = t;
    }
  }

  return bestThreshold;
}

/**
 * Converts ImageData to Grayscale using standard ITU-R BT.601 luminance weights
 * Y = 0.299R + 0.587G + 0.114B
 */
export function applyGrayscale(src: ImageData): ImageData {
  const out = new ImageData(src.width, src.height);
  const sData = src.data;
  const dData = out.data;

  for (let i = 0; i < sData.length; i += 4) {
    const y = Math.round(0.299 * sData[i] + 0.587 * sData[i + 1] + 0.114 * sData[i + 2]);
    dData[i] = y;
    dData[i + 1] = y;
    dData[i + 2] = y;
    dData[i + 3] = sData[i + 3];
  }

  return out;
}

/**
 * Applies 3x3 Noise Reduction (Gaussian smoothing or Median filter)
 */
export function applyNoiseReduction(src: ImageData, mode: 'none' | 'gaussian' | 'median'): ImageData {
  if (mode === 'none') {
    const copy = new ImageData(src.width, src.height);
    copy.data.set(src.data);
    return copy;
  }

  const { width, height } = src;
  const out = new ImageData(width, height);
  const sData = src.data;
  const dData = out.data;

  const getPixel = (x: number, y: number, ch: number) => {
    const clampedX = Math.max(0, Math.min(width - 1, x));
    const clampedY = Math.max(0, Math.min(height - 1, y));
    return sData[(clampedY * width + clampedX) * 4 + ch];
  };

  if (mode === 'gaussian') {
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dstIdx = (y * width + x) * 4;

        for (let ch = 0; ch < 3; ch++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              sum += getPixel(x + kx, y + ky, ch) * kernel[ky + 1][kx + 1];
            }
          }
          dData[dstIdx + ch] = Math.round(sum / 16);
        }
        dData[dstIdx + 3] = sData[dstIdx + 3];
      }
    }
  } else if (mode === 'median') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dstIdx = (y * width + x) * 4;

        for (let ch = 0; ch < 3; ch++) {
          const neighbors: number[] = [];
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              neighbors.push(getPixel(x + kx, y + ky, ch));
            }
          }
          neighbors.sort((a, b) => a - b);
          dData[dstIdx + ch] = neighbors[4];
        }
        dData[dstIdx + 3] = sData[dstIdx + 3];
      }
    }
  }

  return out;
}

/**
 * Applies Laplacian / Unsharp Mask sharpening with strength alpha
 * K_sharpen = [[0, -alpha, 0], [-alpha, 1 + 4*alpha, -alpha], [0, -alpha, 0]]
 */
export function applySharpen(src: ImageData, alpha: number): ImageData {
  if (alpha <= 0.001) {
    const copy = new ImageData(src.width, src.height);
    copy.data.set(src.data);
    return copy;
  }

  const { width, height } = src;
  const out = new ImageData(width, height);
  const sData = src.data;
  const dData = out.data;

  const centerWeight = 1 + 4 * alpha;
  const edgeWeight = -alpha;

  const getPixel = (x: number, y: number, ch: number) => {
    const clampedX = Math.max(0, Math.min(width - 1, x));
    const clampedY = Math.max(0, Math.min(height - 1, y));
    return sData[(clampedY * width + clampedX) * 4 + ch];
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dstIdx = (y * width + x) * 4;

      for (let ch = 0; ch < 3; ch++) {
        const val =
          getPixel(x, y - 1, ch) * edgeWeight +
          getPixel(x - 1, y, ch) * edgeWeight +
          getPixel(x, y, ch) * centerWeight +
          getPixel(x + 1, y, ch) * edgeWeight +
          getPixel(x, y + 1, ch) * edgeWeight;

        dData[dstIdx + ch] = Math.max(0, Math.min(255, Math.round(val)));
      }
      dData[dstIdx + 3] = sData[dstIdx + 3];
    }
  }

  return out;
}

/**
 * Applies Binarization (thresholding) or Inverted Binarization on grayscale image
 */
export function applyBinarization(
  src: ImageData,
  colorMode: 'grayscale' | 'binary' | 'inverted_binary',
  threshold: number
): ImageData {
  const out = new ImageData(src.width, src.height);
  const sData = src.data;
  const dData = out.data;

  for (let i = 0; i < sData.length; i += 4) {
    const gray = sData[i];
    let finalVal = gray;

    if (colorMode === 'binary') {
      finalVal = gray >= threshold ? 255 : 0;
    } else if (colorMode === 'inverted_binary') {
      finalVal = gray >= threshold ? 0 : 255;
    }

    dData[i] = finalVal;
    dData[i + 1] = finalVal;
    dData[i + 2] = finalVal;
    dData[i + 3] = sData[i + 3];
  }

  return out;
}

/**
 * Downsamples an ImageData into an N x N 2D matrix using area-averaging
 */
export function downsampleToMatrix(
  src: ImageData,
  targetSize: number,
  normalize: boolean
): Matrix2D {
  const matrix: Matrix2D = Array.from({ length: targetSize }, () =>
    new Array(targetSize).fill(0)
  );

  const { width, height, data } = src;
  const blockW = width / targetSize;
  const blockH = height / targetSize;

  for (let r = 0; r < targetSize; r++) {
    const startY = Math.floor(r * blockH);
    const endY = Math.min(height, Math.floor((r + 1) * blockH));

    for (let c = 0; c < targetSize; c++) {
      const startX = Math.floor(c * blockW);
      const endX = Math.min(width, Math.floor((c + 1) * blockW));

      let sum = 0;
      let count = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          sum += data[idx];
          count++;
        }
      }

      const avg = count > 0 ? sum / count : 0;
      if (normalize) {
        matrix[r][c] = Math.round((avg / 255) * 100) / 100;
      } else {
        matrix[r][c] = Math.round(avg);
      }
    }
  }

  return matrix;
}

/**
 * Converts a 2D matrix back into ImageData for display
 */
export function matrixToImageData(matrix: Matrix2D, normalize: boolean): ImageData {
  const size = matrix.length;
  const imgData = new ImageData(size, size);
  const data = imgData.data;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = (r * size + c) * 4;
      let val = matrix[r][c];
      if (normalize) {
        val = Math.round(val * 255);
      }
      val = Math.max(0, Math.min(255, Math.round(val)));
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  return imgData;
}

/**
 * Centers a digit in the canvas with margins and aspect ratio preservation
 */
export function centerDigitImage(src: ImageData): ImageData {
  const { width, height, data } = src;
  const out = new ImageData(width, height);
  const outData = out.data;

  // Fill black background
  for (let i = 0; i < outData.length; i += 4) {
    outData[i] = 5;
    outData[i + 1] = 7;
    outData[i + 2] = 14;
    outData[i + 3] = 255;
  }

  // Find bounding box of foreground
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
      if (gray > 45) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    outData.set(data);
    return out;
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const maxBoxDim = Math.max(boxW, boxH);
  const targetContentSize = width * 0.74; // ~74% of canvas
  const scale = targetContentSize / maxBoxDim;

  const targetW = Math.round(boxW * scale);
  const targetH = Math.round(boxH * scale);
  const offsetX = Math.round((width - targetW) / 2);
  const offsetY = Math.round((height - targetH) / 2);

  for (let ty = 0; ty < targetH; ty++) {
    const sy = Math.min(maxY, minY + Math.floor(ty / scale));
    const dy = offsetY + ty;
    if (dy < 0 || dy >= height) continue;

    for (let tx = 0; tx < targetW; tx++) {
      const sx = Math.min(maxX, minX + Math.floor(tx / scale));
      const dx = offsetX + tx;
      if (dx < 0 || dx >= width) continue;

      const srcIdx = (sy * width + sx) * 4;
      const dstIdx = (dy * width + dx) * 4;

      outData[dstIdx] = data[srcIdx];
      outData[dstIdx + 1] = data[srcIdx + 1];
      outData[dstIdx + 2] = data[srcIdx + 2];
      outData[dstIdx + 3] = 255;
    }
  }

  return out;
}

/**
 * Auto-Clean: Applies Laplacian Sharpening (alpha = 1.8), Centers digit, and computes Otsu threshold
 */
export function runAutoClean(rawImg: ImageData): {
  cleanedImg: ImageData;
  optimalThreshold: number;
} {
  // 1. Center the digit
  const centered = centerDigitImage(rawImg);

  // 2. Unsharp Masking / Laplacian Sharpening with alpha = 1.8
  const sharpened = applySharpen(centered, 1.8);

  // 3. Grayscale
  const gray = applyGrayscale(sharpened);

  // 4. Otsu Thresholding to split into crisp binary 0s and 255s
  const optimalThreshold = computeOtsuThreshold(gray);
  const cleanedImg = applyBinarization(gray, 'binary', optimalThreshold);

  return {
    cleanedImg,
    optimalThreshold,
  };
}

/**
 * Creates a blurry, noisy version of an image for side-by-side comparison
 */
export function simulateBlurryImage(rawImg: ImageData): ImageData {
  const smoothed = applyNoiseReduction(rawImg, 'gaussian');
  const copy = new ImageData(smoothed.width, smoothed.height);
  const sData = smoothed.data;
  const dData = copy.data;

  for (let i = 0; i < sData.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    // Lower contrast, soften edges
    const gray = (sData[i] + sData[i + 1] + sData[i + 2]) / 3;
    const softened = Math.max(0, Math.min(255, Math.round(gray * 0.75 + 25 + noise)));
    dData[i] = softened;
    dData[i + 1] = softened;
    dData[i + 2] = softened;
    dData[i + 3] = 255;
  }

  return copy;
}

/**
 * Executes the complete visual pipeline returning intermediate previews
 */
export function runPreprocessingPipeline(
  rawImg: ImageData,
  config: PreprocessConfig
): {
  sharpenedImg: ImageData;
  binarizedImg: ImageData;
  inputMatrix: Matrix2D;
} {
  const smoothed = applyNoiseReduction(rawImg, config.noiseReduction);
  const sharpenedImg = applySharpen(smoothed, config.sharpenAlpha);
  const grayscaleImg = applyGrayscale(sharpenedImg);
  const binarizedImg = applyBinarization(grayscaleImg, config.colorMode, config.threshold);
  const inputMatrix = downsampleToMatrix(binarizedImg, config.targetSize, config.normalize);

  return {
    sharpenedImg,
    binarizedImg,
    inputMatrix,
  };
}
