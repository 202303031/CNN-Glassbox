import type { Matrix2D } from '../types/cnn';

export interface KernelPreset {
  id: string;
  name: string;
  description: string;
  size: 3 | 5;
  weights: Matrix2D;
}

export const KERNEL_PRESETS_3X3: KernelPreset[] = [
  {
    id: 'sobel_x',
    name: 'Sobel X (Vertical Edges)',
    description: 'Highlights vertical boundary gradients (dx/dt)',
    size: 3,
    weights: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
  },
  {
    id: 'sobel_y',
    name: 'Sobel Y (Horizontal Edges)',
    description: 'Highlights horizontal boundary gradients (dy/dt)',
    size: 3,
    weights: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ],
  },
  {
    id: 'ridge',
    name: 'Outline / Ridge Detector',
    description: 'High-pass 2nd-order Laplacian edge detector',
    size: 3,
    weights: [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1],
    ],
  },
  {
    id: 'sharpen',
    name: 'Laplacian Sharpen',
    description: 'Enhances contrast along sharp transitions',
    size: 3,
    weights: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
  },
  {
    id: 'identity',
    name: 'Identity (Pass-through)',
    description: 'Preserves the original feature map without change',
    size: 3,
    weights: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  {
    id: 'emboss',
    name: 'Emboss (3D Relief)',
    description: 'Creates a simulated directional lighting effect',
    size: 3,
    weights: [
      [-2, -1, 0],
      [-1, 1, 1],
      [0, 1, 2],
    ],
  },
  {
    id: 'box_blur',
    name: 'Box Blur (Mean Smoothing)',
    description: 'Averages neighboring pixels to reduce noise',
    size: 3,
    weights: [
      [0.11, 0.11, 0.11],
      [0.11, 0.11, 0.11],
      [0.11, 0.11, 0.11],
    ],
  },
];

export const KERNEL_PRESETS_5X5: KernelPreset[] = [
  {
    id: 'gaussian_5x5',
    name: 'Gaussian Blur 5x5',
    description: 'Smooth low-pass Gaussian filter (sigma ~ 1.0)',
    size: 5,
    weights: [
      [0.004, 0.016, 0.023, 0.016, 0.004],
      [0.016, 0.063, 0.094, 0.063, 0.016],
      [0.023, 0.094, 0.141, 0.094, 0.023],
      [0.016, 0.063, 0.094, 0.063, 0.016],
      [0.004, 0.016, 0.023, 0.016, 0.004],
    ],
  },
  {
    id: 'laplacian_5x5',
    name: 'Laplacian of Gaussian 5x5',
    description: 'Detects circular blobs and edges at larger scale',
    size: 5,
    weights: [
      [0, 0, -1, 0, 0],
      [0, -1, -2, -1, 0],
      [-1, -2, 16, -2, -1],
      [0, -1, -2, -1, 0],
      [0, 0, -1, 0, 0],
    ],
  },
  {
    id: 'identity_5x5',
    name: 'Identity 5x5',
    description: 'Preserves the center pixel with zero periphery',
    size: 5,
    weights: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
  },
  {
    id: 'horizontal_5x5',
    name: 'Horizontal Edge 5x5',
    description: 'Wide horizontal gradient detector',
    size: 5,
    weights: [
      [-1, -2, -3, -2, -1],
      [-1, -2, -3, -2, -1],
      [0, 0, 0, 0, 0],
      [1, 2, 3, 2, 1],
      [1, 2, 3, 2, 1],
    ],
  },
];

export function generateStreetScene(ctx: CanvasRenderingContext2D, size = 128) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, size * 0.6);
  skyGrad.addColorStop(0, '#1e293b');
  skyGrad.addColorStop(1, '#475569');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(size * 0.75, size * 0.25, size * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#eab308';
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(size * 0.1, size * 0.35, size * 0.25, size * 0.45);
  ctx.fillRect(size * 0.4, size * 0.2, size * 0.22, size * 0.6);
  ctx.fillRect(size * 0.68, size * 0.4, size * 0.24, size * 0.4);

  ctx.fillStyle = '#fde047';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      ctx.fillRect(size * 0.44 + c * size * 0.08, size * 0.25 + r * size * 0.07, size * 0.04, size * 0.04);
    }
  }

  const roadGrad = ctx.createLinearGradient(0, size * 0.75, 0, size);
  roadGrad.addColorStop(0, '#334155');
  roadGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, size * 0.75, size, size * 0.25);

  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.88);
  ctx.lineTo(size, size * 0.88);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(size * 0.22, size * 0.85);
  ctx.lineTo(size * 0.22, size * 0.45);
  ctx.lineTo(size * 0.3, size * 0.42);
  ctx.stroke();
}

export function generateCheckerboard(ctx: CanvasRenderingContext2D, size = 128) {
  const blocks = 8;
  const blockSize = size / blocks;

  for (let r = 0; r < blocks; r++) {
    for (let c = 0; c < blocks; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#090d16';
      ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize);
    }
  }

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

export function generateHandwrittenDigit8(ctx: CanvasRenderingContext2D, size = 128) {
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = size / 2;
  const topY = size * 0.36;
  const botY = size * 0.64;
  const rTop = size * 0.2;
  const rBot = size * 0.24;

  ctx.beginPath();
  ctx.arc(cx, topY, rTop, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, botY, rBot, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - rTop * 0.7, topY - rTop * 0.2);
  ctx.lineTo(cx + rBot * 0.8, botY + rBot * 0.3);
  ctx.stroke();
}

export function generateHandwrittenDigit6(ctx: CanvasRenderingContext2D, size = 128) {
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = size * 0.52;
  const cy = size * 0.64;
  const r = size * 0.23;

  // Bottom loop
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Stem curving up to top-right
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.bezierCurveTo(
    cx - r * 0.9, size * 0.3,
    cx - r * 0.2, size * 0.18,
    cx + r * 0.6, size * 0.18
  );
  ctx.stroke();
}

export function generateHandwrittenDigit3(ctx: CanvasRenderingContext2D, size = 128) {
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = size * 0.48;
  const rTop = size * 0.2;
  const rBot = size * 0.23;

  // Top curve
  ctx.beginPath();
  ctx.arc(cx, size * 0.35, rTop, -Math.PI * 0.8, Math.PI * 0.5);
  ctx.stroke();

  // Bottom curve
  ctx.beginPath();
  ctx.arc(cx, size * 0.65, rBot, -Math.PI * 0.5, Math.PI * 0.8);
  ctx.stroke();
}

export function generateHandwrittenDigitMulti69(ctx: CanvasRenderingContext2D, size = 128) {
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.11;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Left digit: '6'
  const c6x = size * 0.28;
  const c6y = size * 0.63;
  const r6 = size * 0.17;

  ctx.beginPath();
  ctx.arc(c6x, c6y, r6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(c6x - r6, c6y);
  ctx.bezierCurveTo(
    c6x - r6 * 0.8, size * 0.35,
    c6x - r6 * 0.1, size * 0.22,
    c6x + r6 * 0.6, size * 0.22
  );
  ctx.stroke();

  // Right digit: '9'
  const c9x = size * 0.72;
  const c9y = size * 0.37;
  const r9 = size * 0.17;

  ctx.beginPath();
  ctx.arc(c9x, c9y, r9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(c9x + r9, c9y);
  ctx.bezierCurveTo(
    c9x + r9 * 0.8, size * 0.65,
    c9x + r9 * 0.1, size * 0.78,
    c9x - r9 * 0.6, size * 0.78
  );
  ctx.stroke();
}

export function generateBlurryDigit8(ctx: CanvasRenderingContext2D, size = 128) {
  // Simulates a low-contrast, blurry noisy camera capture of '8'
  ctx.fillStyle = '#161922';
  ctx.fillRect(0, 0, size, size);

  // Background noise gradient
  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 10, size * 0.5, size * 0.5, size * 0.8);
  grad.addColorStop(0, '#2a3142');
  grad.addColorStop(1, '#0e111a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Soft blurry stroke using shadow blur
  ctx.save();
  ctx.shadowColor = '#d1d5db';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = size * 0.18;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = size / 2;
  const topY = size * 0.36;
  const botY = size * 0.64;
  const rTop = size * 0.2;
  const rBot = size * 0.24;

  ctx.beginPath();
  ctx.arc(cx, topY, rTop, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, botY, rBot, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - rTop * 0.7, topY - rTop * 0.2);
  ctx.lineTo(cx + rBot * 0.8, botY + rBot * 0.3);
  ctx.stroke();

  ctx.restore();

  // Add random speckle noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);
}
