import React, { useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import type { Matrix2D, PreprocessConfig } from '../types/cnn';

interface VisualStripProps {
  rawImg: ImageData | null;
  sharpenedImg: ImageData | null;
  binarizedImg: ImageData | null;
  inputMatrix: Matrix2D;
  config: PreprocessConfig;
}

export const VisualStrip: React.FC<VisualStripProps> = ({
  rawImg,
  sharpenedImg,
  binarizedImg,
  inputMatrix,
  config,
}) => {
  const canvasRawRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSharpRef = useRef<HTMLCanvasElement | null>(null);
  const canvasBinaryRef = useRef<HTMLCanvasElement | null>(null);
  const canvasMatrixRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (rawImg && canvasRawRef.current) {
      const ctx = canvasRawRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 128, 128);
        ctx.putImageData(rawImg, 0, 0);
      }
    }
  }, [rawImg]);

  useEffect(() => {
    if (sharpenedImg && canvasSharpRef.current) {
      const ctx = canvasSharpRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 128, 128);
        ctx.putImageData(sharpenedImg, 0, 0);
      }
    }
  }, [sharpenedImg]);

  useEffect(() => {
    if (binarizedImg && canvasBinaryRef.current) {
      const ctx = canvasBinaryRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 128, 128);
        ctx.putImageData(binarizedImg, 0, 0);
      }
    }
  }, [binarizedImg]);

  useEffect(() => {
    if (canvasMatrixRef.current && inputMatrix.length > 0) {
      const canvas = canvasMatrixRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const size = inputMatrix.length;
        const cellW = 128 / size;
        ctx.clearRect(0, 0, 128, 128);

        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            let val = inputMatrix[r][c];
            if (config.normalize) {
              val = Math.round(val * 255);
            }
            val = Math.max(0, Math.min(255, Math.round(val)));

            ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
            ctx.fillRect(c * cellW, r * cellW, cellW, cellW);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(c * cellW, r * cellW, cellW, cellW);
          }
        }
      }
    }
  }, [inputMatrix, config.normalize]);

  return (
    <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Eye className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Visual Preprocessing Strip (High-Resolution Transformation Previews)
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Canvas Resolution: 128×128 px
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
        {/* Stage 1: Raw Image */}
        <div className="flex flex-col items-center bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 relative group">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">1. Raw Image</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              RGB (128²)
            </span>
          </div>
          <div className="relative rounded-lg overflow-hidden border border-slate-700/60 shadow-md">
            <canvas
              ref={canvasRawRef}
              width={128}
              height={128}
              className="w-24 h-24 sm:w-28 sm:h-28 object-cover bg-black"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Unprocessed upload/preset
          </p>
        </div>

        {/* Stage 2: Sharpened Output */}
        <div className="flex flex-col items-center bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 relative group">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-300">2. De-blurred</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/50 text-indigo-400 font-mono border border-indigo-500/20">
              α={config.sharpenAlpha.toFixed(1)}
            </span>
          </div>
          <div className="relative rounded-lg overflow-hidden border border-indigo-500/40 shadow-md">
            <canvas
              ref={canvasSharpRef}
              width={128}
              height={128}
              className="w-24 h-24 sm:w-28 sm:h-28 object-cover bg-black"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Laplacian high-pass boost
          </p>
        </div>

        {/* Stage 3: Grayscale / B&W */}
        <div className="flex flex-col items-center bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 relative group">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300">
              {config.colorMode === 'grayscale'
                ? '3. Grayscale'
                : config.colorMode === 'binary'
                ? '3. Binary (B&W)'
                : '3. Inverted B&W'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-400 font-mono border border-amber-500/20">
              T={config.threshold}
            </span>
          </div>
          <div className="relative rounded-lg overflow-hidden border border-amber-500/40 shadow-md">
            <canvas
              ref={canvasBinaryRef}
              width={128}
              height={128}
              className="w-24 h-24 sm:w-28 sm:h-28 object-cover bg-black"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            {config.colorMode === 'grayscale'
              ? 'Luminance conversion'
              : 'Crisp binary split'}
          </p>
        </div>

        {/* Stage 4: Downsampled CNN Input Matrix */}
        <div className="flex flex-col items-center bg-slate-950/70 p-3 rounded-xl border border-emerald-500/30 relative ring-1 ring-emerald-500/20">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300">
              4. CNN Input (I)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 font-mono border border-emerald-500/30">
              {config.targetSize}×{config.targetSize}
            </span>
          </div>
          <div className="relative rounded-lg overflow-hidden border border-emerald-500/50 shadow-md">
            <canvas
              ref={canvasMatrixRef}
              width={128}
              height={128}
              className="w-24 h-24 sm:w-28 sm:h-28 object-cover bg-black image-rendering-pixelated"
            />
          </div>
          <p className="text-[10px] text-emerald-400 mt-2 text-center font-medium">
            Fed directly into CNN Matrix
          </p>
        </div>
      </div>
    </div>
  );
};
