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
