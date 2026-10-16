import type {
  Matrix2D,
  ConvolutionConfig,
  PoolingConfig,
  ConvResult,
  PoolResult,
  ConvStepDetail,
  PoolStepDetail,
} from '../types/cnn';

/**
 * Creates a zero-padded matrix of size (H + 2P) x (W + 2P)
 */
export function applyPadding(matrix: Matrix2D, padding: number): Matrix2D {
  const h = matrix.length;
  if (h === 0) return [];
  const w = matrix[0].length;

  if (padding === 0) {
    return matrix.map((row) => [...row]);
  }

  const paddedH = h + 2 * padding;
  const paddedW = w + 2 * padding;
  const padded: Matrix2D = Array.from({ length: paddedH }, () =>
    new Array(paddedW).fill(0)
  );

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      padded[r + padding][c + padding] = matrix[r][c];
    }
  }

  return padded;
}

/**
 * Applies activation function: None, ReLU, or Leaky ReLU
 */
export function applyActivation(
  val: number,
  activation: 'none' | 'relu' | 'leaky_relu'
): number {
  if (activation === 'relu') {
    return Math.max(0, val);
  }
  if (activation === 'leaky_relu') {
    return val >= 0 ? val : 0.1 * val;
  }
  return val;
}

/**
 * Executes 2D Convolution on an input matrix with editable kernel weights, padding, stride, bias, and activation
 */
export function convolve2D(
  inputMatrix: Matrix2D,
  config: ConvolutionConfig,
  normalize: boolean
): ConvResult {
  const { kernel, kernelSize, padding, stride, bias, activation } = config;
  const inputSize = inputMatrix.length;

  // 1. Generate padded input matrix
  const paddedInput = applyPadding(inputMatrix, padding);

  // 2. Compute spatial dimensions
  // O_conv = floor((I - K + 2P) / S) + 1
  const outSize = Math.max(0, Math.floor((inputSize - kernelSize + 2 * padding) / stride) + 1);

  const convMap: Matrix2D = Array.from({ length: outSize }, () =>
    new Array(outSize).fill(0)
  );
  const steps: ConvStepDetail[] = [];

  for (let outR = 0; outR < outSize; outR++) {
    for (let outC = 0; outC < outSize; outC++) {
      const patchR = outR * stride;
      const patchC = outC * stride;

      const patch: Matrix2D = [];
      const products: Matrix2D = [];
      let sum = 0;

      for (let kr = 0; kr < kernelSize; kr++) {
        const patchRow: number[] = [];
        const prodRow: number[] = [];
        for (let kc = 0; kc < kernelSize; kc++) {
          const inVal = paddedInput[patchR + kr][patchC + kc] ?? 0;
          const kVal = kernel[kr][kc];
          const prod = inVal * kVal;

          patchRow.push(inVal);
          prodRow.push(Math.round(prod * 1000) / 1000);
          sum += prod;
        }
        patch.push(patchRow);
        products.push(prodRow);
      }

      // Add bias
      const preActivation = sum + bias;

      // Apply activation
      const activatedVal = applyActivation(preActivation, activation);

      // Round for display/precision
      const finalVal = normalize
        ? Math.round(activatedVal * 100) / 100
        : Math.round(activatedVal * 10) / 10;

      convMap[outR][outC] = finalVal;

      steps.push({
        outR,
        outC,
        patchR,
        patchC,
        patch,
        kernel: kernel.map((r) => [...r]),
        products,
        sum: Math.round(sum * 100) / 100,
        bias,
        preActivation: Math.round(preActivation * 100) / 100,
        activation,
        outputValue: finalVal,
      });
    }
  }

  return {
    paddedInput,
    convMap,
    outSize,
    steps,
  };
}

/**
 * Executes 2D Max or Average Pooling on a feature map
 */
export function pool2D(
  convMap: Matrix2D,
  config: PoolingConfig,
  normalize: boolean
): PoolResult {
  const { mode, windowSize, stride } = config;
  const inSize = convMap.length;

  if (inSize === 0) {
    return { poolMap: [], outSize: 0, steps: [] };
  }

  // O_pool = floor((O_conv - K_p) / S_p) + 1
  const outSize = Math.max(0, Math.floor((inSize - windowSize) / stride) + 1);

  const poolMap: Matrix2D = Array.from({ length: outSize }, () =>
    new Array(outSize).fill(0)
  );
  const steps: PoolStepDetail[] = [];

  for (let outR = 0; outR < outSize; outR++) {
    for (let outC = 0; outC < outSize; outC++) {
      const windowR = outR * stride;
      const windowC = outC * stride;

      const values: Matrix2D = [];
      let maxVal = -Infinity;
      let winR = 0;
      let winC = 0;
      let sum = 0;
      let count = 0;

      for (let wr = 0; wr < windowSize; wr++) {
        const valRow: number[] = [];
        for (let wc = 0; wc < windowSize; wc++) {
          const v = convMap[windowR + wr][windowC + wc];
          valRow.push(v);
          sum += v;
          count++;

          if (v > maxVal) {
            maxVal = v;
            winR = wr;
            winC = wc;
          }
        }
        values.push(valRow);
      }

      let outVal = 0;
      if (mode === 'max') {
        outVal = maxVal === -Infinity ? 0 : maxVal;
      } else {
        outVal = count > 0 ? sum / count : 0;
      }

      const finalVal = normalize
        ? Math.round(outVal * 100) / 100
        : Math.round(outVal * 10) / 10;

      poolMap[outR][outC] = finalVal;

      steps.push({
        outR,
        outC,
        windowR,
        windowC,
        windowSize,
        mode,
        values,
        winningR: mode === 'max' ? winR : undefined,
        winningC: mode === 'max' ? winC : undefined,
        outputValue: finalVal,
      });
    }
  }

  return {
    poolMap,
    outSize,
    steps,
  };
}

/**
 * Returns coordinate range in convMap influenced by pool cell (r_p, c_p)
 */
export function getConvWindowForPoolCell(
  r_p: number,
  c_p: number,
  poolConfig: PoolingConfig
) {
  return {
    startR: r_p * poolConfig.stride,
    startC: c_p * poolConfig.stride,
    size: poolConfig.windowSize,
  };
}

/**
 * Returns coordinate range in paddedInput influenced by conv cell (r_c, c_c)
 */
export function getInputWindowForConvCell(
  r_c: number,
  c_c: number,
  convConfig: ConvolutionConfig
) {
  return {
    startR: r_c * convConfig.stride,
    startC: c_c * convConfig.stride,
    size: convConfig.kernelSize,
  };
}

/**
 * Returns overall receptive field on paddedInput for a pool cell (r_p, c_p)
 */
export function getFullReceptiveFieldForPool(
  r_p: number,
  c_p: number,
  convConfig: ConvolutionConfig,
  poolConfig: PoolingConfig
) {
  const convWin = getConvWindowForPoolCell(r_p, c_p, poolConfig);
  const minConvR = convWin.startR;
  const maxConvR = convWin.startR + convWin.size - 1;
  const minConvC = convWin.startC;
  const maxConvC = convWin.startC + convWin.size - 1;

  const minInR = minConvR * convConfig.stride;
  const maxInR = maxConvR * convConfig.stride + convConfig.kernelSize - 1;
  const minInC = minConvC * convConfig.stride;
  const maxInC = maxConvC * convConfig.stride + convConfig.kernelSize - 1;

  return {
    startR: minInR,
    startC: minInC,
    endR: maxInR,
    endC: maxInC,
  };
}
