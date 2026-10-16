export type ColorMode = 'grayscale' | 'binary' | 'inverted_binary';

export type NoiseReduction = 'none' | 'gaussian' | 'median';

export type ActivationFunction = 'none' | 'relu' | 'leaky_relu';

export type PoolingMode = 'max' | 'average';

export interface PreprocessConfig {
  colorMode: ColorMode;
  threshold: number;
  sharpenAlpha: number; // 0.0 to 3.0
  noiseReduction: NoiseReduction;
  normalize: boolean; // raw integers (0-255) vs normalized floats (0.00-1.00)
  targetSize: number; // 12, 16, 24, or 28
}

export type Matrix2D = number[][];

export interface ConvolutionConfig {
  kernelSize: 3 | 5;
  kernel: Matrix2D;
  padding: number; // 0 to 3
  stride: number; // 1 to 4
  bias: number;
  activation: ActivationFunction;
}

export interface PoolingConfig {
  mode: PoolingMode;
  windowSize: 2 | 3;
  stride: number; // 1 to 3
}

export interface ConvStepDetail {
  outR: number;
  outC: number;
  patchR: number;
  patchC: number;
  patch: Matrix2D;
  kernel: Matrix2D;
  products: Matrix2D;
  sum: number;
  bias: number;
  preActivation: number;
  activation: ActivationFunction;
  outputValue: number;
}

export interface PoolStepDetail {
  outR: number;
  outC: number;
  windowR: number;
  windowC: number;
  windowSize: number;
  mode: PoolingMode;
  values: Matrix2D;
  winningR?: number; // relative to window
  winningC?: number;
  outputValue: number;
}

export interface ConvResult {
  paddedInput: Matrix2D;
  convMap: Matrix2D;
  outSize: number;
  steps: ConvStepDetail[];
}

export interface PoolResult {
  poolMap: Matrix2D;
  outSize: number;
  steps: PoolStepDetail[];
}

export interface HoverState {
  type: 'conv' | 'pool' | 'input' | null;
  r?: number;
  c?: number;
}

export interface DigitPrediction {
  digit: number;
  probability: number; // 0.00 to 1.00
  rawLogit: number;
}

export interface DigitBoundingBox {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  digit: number;
  confidence: number;
}

export interface MultiDigitResult {
  isMultiDigit: boolean;
  detectedDigits: number[];
  boxes: DigitBoundingBox[];
}

export interface ClassificationResult {
  flattenedVector: number[];
  probabilities: DigitPrediction[]; // 10 classes (0-9)
  topPrediction: DigitPrediction;
  secondPrediction: DigitPrediction;
  multiDigitResult?: MultiDigitResult;
}
