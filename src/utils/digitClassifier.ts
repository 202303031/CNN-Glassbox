import type {
  Matrix2D,
  DigitPrediction,
  MultiDigitResult,
  DigitBoundingBox,
  ClassificationResult,
  ConvolutionConfig,
  PoolingConfig,
} from '../types/cnn';
import { convolve2D, pool2D } from './cnnEngine';

/**
 * Resamples any N x M matrix into a canonical 11 x 11 matrix via bilinear interpolation
 */
export function resampleTo11x11(matrix: Matrix2D): Matrix2D {
  const h = matrix.length;
  if (h === 0) return Array.from({ length: 11 }, () => new Array(11).fill(0));
  const w = matrix[0].length;
  if (h === 11 && w === 11) {
    return matrix.map((row) => [...row]);
  }

  const out: Matrix2D = Array.from({ length: 11 }, () => new Array(11).fill(0));

  for (let r = 0; r < 11; r++) {
    const srcR = (r / 10) * (h - 1);
    const r0 = Math.floor(srcR);
    const r1 = Math.min(h - 1, r0 + 1);
    const dr = srcR - r0;

    for (let c = 0; c < 11; c++) {
      const srcC = (c / 10) * (w - 1);
      const c0 = Math.floor(srcC);
      const c1 = Math.min(w - 1, c0 + 1);
      const dc = srcC - c0;

      const v00 = matrix[r0][c0];
      const v01 = matrix[r0][c1];
      const v10 = matrix[r1][c0];
      const v11 = matrix[r1][c1];

      const top = v00 * (1 - dc) + v01 * dc;
      const bot = v10 * (1 - dc) + v11 * dc;
      out[r][c] = top * (1 - dr) + bot * dr;
    }
  }

  return out;
}

/**
 * Flattens an 11 x 11 matrix into a 121-element 1D feature vector
 */
export function flattenMatrix(matrix: Matrix2D): number[] {
  const flat: number[] = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      flat.push(matrix[r][c]);
    }
  }
  return flat;
}

/**
 * Canonical 11x11 spatial activation patterns for digits 0-9
 * Values: 1.0 = positive stroke, -0.8 = strong negative inhibition / center holes
 */
function createDigitTemplates(): number[][][] {
  // 11x11 templates for digits 0 through 9
  const templates: number[][][] = Array.from({ length: 10 }, () =>
    Array.from({ length: 11 }, () => new Array(11).fill(-0.2))
  );

  // Helper to draw stroke on 11x11
  const line = (d: number, r0: number, c0: number, r1: number, c1: number, weight = 1.0) => {
    const steps = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0)) * 2 || 1;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const r = Math.round(r0 + t * (r1 - r0));
      const c = Math.round(c0 + t * (c1 - c0));
      if (r >= 0 && r < 11 && c >= 0 && c < 11) {
        templates[d][r][c] = Math.max(templates[d][r][c], weight);
      }
    }
  };

  const hole = (d: number, r0: number, c0: number, r1: number, c1: number, penalty = -0.9) => {
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (r >= 0 && r < 11 && c >= 0 && c < 11) {
          templates[d][r][c] = penalty;
        }
      }
    }
  };

  // 0: Full outer oval, hollow core
  line(0, 1, 3, 1, 7, 1.0);
  line(0, 9, 3, 9, 7, 1.0);
  line(0, 2, 2, 8, 2, 1.0);
  line(0, 2, 8, 8, 8, 1.0);
  hole(0, 3, 4, 7, 6, -1.0);

  // 1: Center vertical column
  line(1, 1, 5, 9, 5, 1.2);
  line(1, 1, 6, 9, 6, 1.0);
  line(1, 2, 3, 1, 5, 0.8);
  line(1, 9, 3, 9, 7, 0.7);
  hole(1, 2, 1, 8, 3, -0.8);
  hole(1, 2, 8, 8, 10, -0.8);

  // 2: Top arch, diagonal down-left, flat bottom base
  line(2, 1, 3, 1, 7, 1.0);
  line(2, 2, 8, 4, 8, 1.0);
  line(2, 4, 8, 8, 2, 1.1);
  line(2, 9, 2, 9, 8, 1.2);
  hole(2, 3, 2, 6, 4, -0.8);
  hole(2, 6, 6, 8, 8, -0.7);

  // 3: Top bar, middle cusp, bottom curve, open left side
  line(3, 1, 3, 1, 7, 1.0);
  line(3, 2, 8, 4, 8, 1.0);
  line(3, 5, 4, 5, 7, 1.0);
  line(3, 6, 8, 8, 8, 1.0);
  line(3, 9, 3, 9, 7, 1.0);
  hole(3, 3, 1, 7, 3, -1.0); // No left vertical line!

  // 4: Left vertical stem, cross bar, right main vertical
  line(4, 1, 2, 5, 2, 1.0);
  line(4, 5, 2, 5, 8, 1.1);
  line(4, 1, 7, 9, 7, 1.2);
  hole(4, 6, 1, 9, 4, -0.9);
  hole(4, 1, 4, 3, 5, -0.6);

  // 5: Top bar, upper-left stem, middle bar, lower right loop, bottom bar
  line(5, 1, 2, 1, 8, 1.1);
  line(5, 2, 2, 4, 2, 1.0);
  line(5, 4, 2, 4, 7, 1.0);
  line(5, 5, 8, 8, 8, 1.0);
  line(5, 9, 2, 9, 7, 1.0);
  hole(5, 2, 5, 4, 8, -0.9);
  hole(5, 6, 1, 8, 4, -0.9);

  // 6: Left stem curving down into closed bottom loop
  line(6, 1, 3, 1, 7, 0.9);
  line(6, 2, 2, 8, 2, 1.1);
  line(6, 5, 2, 5, 8, 1.0);
  line(6, 6, 8, 8, 8, 1.0);
  line(6, 9, 2, 9, 8, 1.0);
  hole(6, 6, 4, 8, 6, -1.0); // bottom loop hole
  hole(6, 1, 6, 4, 9, -1.1); // top right must be empty!

  // 7: Top bar and diagonal down to bottom center
  line(7, 1, 2, 1, 9, 1.2);
  line(7, 2, 8, 4, 7, 1.0);
  line(7, 4, 7, 9, 4, 1.1);
  hole(7, 3, 1, 9, 3, -1.0);
  hole(7, 5, 6, 9, 9, -0.8);

  // 8: Two stacked loops (figure-8)
  line(8, 1, 3, 1, 7, 1.0);
  line(8, 2, 2, 4, 2, 1.0);
  line(8, 2, 8, 4, 8, 1.0);
  line(8, 5, 3, 5, 7, 1.1); // center crossing
  line(8, 6, 2, 8, 2, 1.0);
  line(8, 6, 8, 8, 8, 1.0);
  line(8, 9, 3, 9, 7, 1.0);
  hole(8, 3, 4, 4, 6, -0.7); // top hole
  hole(8, 7, 4, 8, 6, -0.7); // bottom hole

  // 9: Top closed loop with right descending stem
  line(9, 1, 3, 1, 7, 1.0);
  line(9, 2, 2, 5, 2, 1.0);
  line(9, 5, 2, 5, 8, 1.0);
  line(9, 2, 8, 9, 8, 1.2);
  line(9, 9, 3, 9, 7, 0.9);
  hole(9, 2, 4, 4, 6, -1.0); // top hole
  hole(9, 6, 1, 9, 5, -1.1); // bottom-left must be empty!

  return templates;
}

const DIGIT_TEMPLATES = createDigitTemplates();

/**
 * Extracts topological features from an 11x11 matrix (number of holes, mass centroids)
 */
function extractTopologyFeatures(matrix: Matrix2D) {
  let totalMass = 0;
  let topMass = 0;
  let bottomMass = 0;
  let leftMass = 0;
  let rightMass = 0;
  let centerMass = 0;

  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 11; c++) {
      const v = Math.max(0, matrix[r][c]);
      totalMass += v;
      if (r < 5) topMass += v;
      if (r > 5) bottomMass += v;
      if (c < 5) leftMass += v;
      if (c > 5) rightMass += v;
      if (r >= 3 && r <= 7 && c >= 3 && c <= 7) centerMass += v;
    }
  }

  // Count enclosed holes via inverted flood fill
  const bin: boolean[][] = Array.from({ length: 11 }, (_, r) =>
    Array.from({ length: 11 }, (_, c) => matrix[r][c] > 0.25)
  );

  // Flood fill outside background from borders
  const visited: boolean[][] = Array.from({ length: 11 }, () => new Array(11).fill(false));
  const queue: [number, number][] = [];

  for (let i = 0; i < 11; i++) {
    if (!bin[0][i]) queue.push([0, i]);
    if (!bin[10][i]) queue.push([10, i]);
    if (!bin[i][0]) queue.push([i, 0]);
    if (!bin[i][10]) queue.push([i, 10]);
  }

  while (queue.length > 0) {
    const [qr, qc] = queue.pop()!;
    if (qr < 0 || qr >= 11 || qc < 0 || qc >= 11) continue;
    if (visited[qr][qc] || bin[qr][qc]) continue;
    visited[qr][qc] = true;

    queue.push([qr - 1, qc]);
    queue.push([qr + 1, qc]);
    queue.push([qr, qc - 1]);
    queue.push([qr, qc + 1]);
  }

  // Any unvisited 0-cells not on borders are enclosed holes!
  let topHolePixels = 0;
  let bottomHolePixels = 0;

  for (let r = 1; r < 10; r++) {
    for (let c = 1; c < 10; c++) {
      if (!bin[r][c] && !visited[r][c]) {
        if (r <= 5) topHolePixels++;
        else bottomHolePixels++;
      }
    }
  }

  const hasTopHole = topHolePixels >= 2;
  const hasBottomHole = bottomHolePixels >= 2;
  const holeCount = (hasTopHole ? 1 : 0) + (hasBottomHole ? 1 : 0);

  return {
    totalMass,
    topRatio: totalMass > 0 ? topMass / totalMass : 0.5,
    bottomRatio: totalMass > 0 ? bottomMass / totalMass : 0.5,
    leftRatio: totalMass > 0 ? leftMass / totalMass : 0.5,
    rightRatio: totalMass > 0 ? rightMass / totalMass : 0.5,
    centerRatio: totalMass > 0 ? centerMass / totalMass : 0.5,
    hasTopHole,
    hasBottomHole,
    holeCount,
  };
}

/**
 * Computes raw logits and Softmax probabilities for digits 0-9
 */
export function classify11x11(matrix: Matrix2D): DigitPrediction[] {
  // Normalize matrix into [0.0, 1.0]
  let maxV = 0.0001;
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 11; c++) {
      if (matrix[r][c] > maxV) maxV = matrix[r][c];
    }
  }

  const normMatrix: Matrix2D = matrix.map((row) =>
    row.map((v) => Math.max(0, Math.min(1, v / maxV)))
  );

  const topo = extractTopologyFeatures(normMatrix);
  const rawLogits: number[] = new Array(10).fill(0);

  for (let d = 0; d < 10; d++) {
    let score = 0;
    const template = DIGIT_TEMPLATES[d];

    for (let r = 0; r < 11; r++) {
      for (let c = 0; c < 11; c++) {
        score += normMatrix[r][c] * template[r][c];
      }
    }

    // Topological adjustments
    if (d === 8) {
      if (topo.holeCount === 2) score += 4.5;
      else if (topo.holeCount === 1) score += 1.0;
      else score -= 1.5;
    } else if (d === 0) {
      if (topo.holeCount >= 1 && topo.centerRatio < 0.35) score += 4.0;
      if (topo.holeCount === 2) score -= 3.0; // 0 doesn't have 2 holes!
    } else if (d === 6) {
      if (topo.hasBottomHole && !topo.hasTopHole) score += 4.0;
      if (topo.bottomRatio > topo.topRatio + 0.1) score += 1.5;
    } else if (d === 9) {
      if (topo.hasTopHole && !topo.hasBottomHole) score += 4.0;
      if (topo.topRatio > topo.bottomRatio + 0.1) score += 1.5;
    } else if (d === 1) {
      if (topo.leftRatio < 0.25 && topo.rightRatio < 0.25) score += 4.0;
      if (topo.holeCount > 0) score -= 4.0;
    } else if (d === 7) {
      if (topo.topRatio > 0.45 && topo.bottomRatio < 0.35) score += 2.5;
      if (topo.holeCount > 0) score -= 3.0;
    } else if (d === 3) {
      if (topo.leftRatio < 0.35 && topo.rightRatio > 0.45) score += 2.0;
      if (topo.holeCount > 0) score -= 2.0;
    } else if (d === 2) {
      if (topo.holeCount > 0) score -= 2.5;
    } else if (d === 5) {
      if (topo.holeCount > 0) score -= 2.5;
    } else if (d === 4) {
      if (topo.holeCount === 1) score += 1.5;
    }

    rawLogits[d] = Math.round(score * 100) / 100;
  }

  // Softmax with temperature scaling for sharp, confident probabilities
  const temperature = 1.4;
  const scaledLogits = rawLogits.map((l) => l / temperature);
  const maxLogit = Math.max(...scaledLogits);
  const expValues = scaledLogits.map((l) => Math.exp(l - maxLogit));
  const sumExp = expValues.reduce((a, b) => a + b, 0);

  const predictions: DigitPrediction[] = expValues.map((ev, d) => ({
    digit: d,
    probability: Math.round((ev / sumExp) * 1000) / 1000,
    rawLogit: rawLogits[d],
  }));

  return predictions;
}

/**
 * Runs 8-way Connected Component Analysis (CCA) to detect multiple separate digits
 */
export function detectConnectedDigits(
  binarizedImg: ImageData,
  convConfig: ConvolutionConfig,
  poolConfig: PoolingConfig,
  normalize: boolean
): MultiDigitResult {
  const { width, height, data } = binarizedImg;
  const visited = new Uint8Array(width * height);
  const components: { minX: number; maxX: number; minY: number; maxY: number; count: number }[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;

      // Check foreground (white pixel on dark background)
      const isForeground = data[idx * 4] > 120;
      if (!isForeground) {
        visited[idx] = 1;
        continue;
      }

      // BFS Connected Component
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let count = 0;
      const queue: [number, number][] = [[x, y]];
      visited[idx] = 1;

      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!;
        count++;

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // 8-way neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              if (!visited[nIdx] && data[nIdx * 4] > 120) {
                visited[nIdx] = 1;
                queue.push([nx, ny]);
              }
            }
          }
        }
      }

      // Filter out small noise artifacts (must have at least 25 pixels and dimension >= 8)
      const compW = maxX - minX + 1;
      const compH = maxY - minY + 1;
      if (count >= 25 && compW >= 6 && compH >= 8) {
        components.push({ minX, maxX, minY, maxY, count });
      }
    }
  }

  // Sort components horizontally (left-to-right)
  components.sort((a, b) => a.minX - b.minX);

  if (components.length <= 1) {
    return {
      isMultiDigit: false,
      detectedDigits: [],
      boxes: [],
    };
  }

  // Multi-digit detected! Classify each component individually
  const boxes: DigitBoundingBox[] = [];
  const detectedDigits: number[] = [];

  components.forEach((comp, idx) => {
    const compW = comp.maxX - comp.minX + 1;
    const compH = comp.maxY - comp.minY + 1;
    const squareSide = Math.max(compW, compH) + 12; // Add padding around component

    // Create square crop centered on component
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = 24;
    cropCanvas.height = 24;
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 24, 24);

    // Draw component pixels into standard 24x24 matrix
    const scale = 20 / squareSide;
    const drawW = Math.max(1, compW * scale);
    const drawH = Math.max(1, compH * scale);
    const drawX = (24 - drawW) / 2;
    const drawY = (24 - drawH) / 2;

    const subImgCanvas = document.createElement('canvas');
    subImgCanvas.width = compW;
    subImgCanvas.height = compH;
    const subCtx = subImgCanvas.getContext('2d');
    if (subCtx) {
      const subData = subCtx.createImageData(compW, compH);
      for (let y = 0; y < compH; y++) {
        for (let x = 0; x < compW; x++) {
          const srcIdx = ((comp.minY + y) * width + (comp.minX + x)) * 4;
          const dstIdx = (y * compW + x) * 4;
          const val = data[srcIdx];
          subData.data[dstIdx] = val;
          subData.data[dstIdx + 1] = val;
          subData.data[dstIdx + 2] = val;
          subData.data[dstIdx + 3] = 255;
        }
      }
      subCtx.putImageData(subData, 0, 0);
      ctx.drawImage(subImgCanvas, drawX, drawY, drawW, drawH);
    }

    const digitImg = ctx.getImageData(0, 0, 24, 24);
    const matrix: Matrix2D = Array.from({ length: 24 }, (_, r) =>
      Array.from({ length: 24 }, (_, c) => digitImg.data[(r * 24 + c) * 4])
    );

    // Run through CNN pipeline
    const conv = convolve2D(matrix, convConfig, normalize);
    const pool = pool2D(conv.convMap, poolConfig, normalize);
    const pool11 = resampleTo11x11(pool.poolMap);
    const preds = classify11x11(pool11);

    preds.sort((a, b) => b.probability - a.probability);
    const best = preds[0];

    detectedDigits.push(best.digit);
    boxes.push({
      id: idx,
      x: comp.minX,
      y: comp.minY,
      width: compW,
      height: compH,
      digit: best.digit,
      confidence: Math.round(best.probability * 1000) / 10,
    });
  });

  return {
    isMultiDigit: true,
    detectedDigits,
    boxes,
  };
}

/**
 * High-level classification runner on pooled map and binarized image
 */
export function classifyPipeline(
  poolMap: Matrix2D,
  binarizedImg: ImageData | null,
  convConfig: ConvolutionConfig,
  poolConfig: PoolingConfig,
  normalize: boolean
): ClassificationResult {
  // 1. Resample to canonical 11x11 grid if needed
  const canonicalPool = resampleTo11x11(poolMap);

  // 2. Flatten into 121-element 1D vector
  const flattenedVector = flattenMatrix(canonicalPool);

  // 3. Dense Softmax Classification for single/primary digit
  const probabilities = classify11x11(canonicalPool);

  // Sort descending by probability
  const sorted = [...probabilities].sort((a, b) => b.probability - a.probability);
  const topPrediction = sorted[0];
  const secondPrediction = sorted[1];

  // 4. Multi-digit detection if binarized image is available
  let multiDigitResult: MultiDigitResult | undefined = undefined;
  if (binarizedImg) {
    try {
      multiDigitResult = detectConnectedDigits(
        binarizedImg,
        convConfig,
        poolConfig,
        normalize
      );
    } catch {
      // Fallback to single digit gracefully
    }
  }

  return {
    flattenedVector,
    probabilities,
    topPrediction,
    secondPrediction,
    multiDigitResult,
  };
}
