import React, { useMemo, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import type {
  ConvolutionConfig,
  PoolingConfig,
} from '../types/cnn';
import {
  simulateBlurryImage,
  runAutoClean,
  downsampleToMatrix,
} from '../utils/preprocess';
import { convolve2D, pool2D } from '../utils/cnnEngine';
import { classifyPipeline } from '../utils/digitClassifier';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawImg: ImageData | null;
  convConfig: ConvolutionConfig;
  poolConfig: PoolingConfig;
  normalize: boolean;
  onApplyCleaned: (cleanedImg: ImageData, optimalThreshold: number) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  rawImg,
  convConfig,
  poolConfig,
  normalize,
  onApplyCleaned,
}) => {
  const canvasBlurRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCleanRef = useRef<HTMLCanvasElement | null>(null);

  // Compute Blurry Pipeline vs Cleaned Pipeline
  const compareData = useMemo(() => {
    if (!rawImg) return null;

    // 1. Blurry pipeline
    const blurryImg = simulateBlurryImage(rawImg);
    const blurryMatrix = downsampleToMatrix(blurryImg, 24, normalize);
    const blurryConv = convolve2D(blurryMatrix, convConfig, normalize);
    const blurryPool = pool2D(blurryConv.convMap, poolConfig, normalize);
    const blurryClass = classifyPipeline(
      blurryPool.poolMap,
      blurryImg,
      convConfig,
      poolConfig,
      normalize
    );

    // 2. Cleaned pipeline (Auto-Clean: Sharpen 1.8, Center, Otsu binary)
    const { cleanedImg, optimalThreshold } = runAutoClean(rawImg);
    const cleanMatrix = downsampleToMatrix(cleanedImg, 24, normalize);
    const cleanConv = convolve2D(cleanMatrix, convConfig, normalize);
    const cleanPool = pool2D(cleanConv.convMap, poolConfig, normalize);
    const cleanClass = classifyPipeline(
      cleanPool.poolMap,
      cleanedImg,
      convConfig,
      poolConfig,
      normalize
    );

    return {
      blurryImg,
      blurryClass,
      cleanedImg,
      optimalThreshold,
      cleanClass,
    };
  }, [rawImg, convConfig, poolConfig, normalize]);

  // Render canvases
  useEffect(() => {
    if (!isOpen || !compareData) return;

    if (canvasBlurRef.current) {
      const ctx = canvasBlurRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 128, 128);
        ctx.putImageData(compareData.blurryImg, 0, 0);
      }
    }

    if (canvasCleanRef.current) {
      const ctx = canvasCleanRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 128, 128);
        ctx.putImageData(compareData.cleanedImg, 0, 0);
      }
    }
  }, [isOpen, compareData]);

  if (!isOpen || !compareData) return null;

  const { blurryClass, cleanClass, cleanedImg, optimalThreshold } = compareData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Preprocessing Clarifier: Blurry Input vs Cleaned Input
              </h2>
              <p className="text-xs text-slate-400">
                Observe how de-blurring and Otsu binarization resolve classification uncertainty into confident recognition.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Side-by-Side Comparison */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ============================================================== */}
          {/* COLUMN 1: Blurry Input */}
          {/* ============================================================== */}
          <div className="bg-slate-950/90 rounded-2xl border border-rose-500/30 p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-rose-300">
                  A. Run on Blurry / Noisy Input
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300">
                α = 0.0 (Unsharpened)
              </span>
            </div>

            {/* Canvas Preview */}
            <div className="flex items-center justify-center py-2">
              <div className="relative rounded-xl overflow-hidden border-2 border-rose-500/40 shadow-lg">
                <canvas
                  ref={canvasBlurRef}
                  width={128}
                  height={128}
                  className="w-28 h-28 object-cover bg-black"
                />
              </div>
            </div>

            {/* Prediction Output Badge */}
            <div className="bg-rose-950/30 rounded-xl border border-rose-500/30 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400">
                  Prediction
                </span>
                <p className="text-base font-bold text-white">
                  Digit <span className="text-rose-400 font-mono">{blurryClass.topPrediction.digit}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400">
                  Confidence
                </span>
                <p className="text-base font-mono font-bold text-rose-400">
                  {(blurryClass.topPrediction.probability * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Runner up & Status */}
            <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Uncertainty state:</span>
                <span className="text-rose-300 font-semibold">High Confusion</span>
              </div>
              <div className="flex justify-between">
                <span>Runner-up:</span>
                <span className="font-mono text-amber-300">
                  Digit {blurryClass.secondPrediction.digit} ({(blurryClass.secondPrediction.probability * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Probability Bars */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] uppercase font-mono text-slate-400">
                Probability Spread (Digits 0-9)
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {blurryClass.probabilities.map((p) => (
                  <div
                    key={p.digit}
                    className="p-1 rounded bg-slate-900 border border-slate-800 flex flex-col items-center"
                  >
                    <span className="text-[9px] text-slate-400">D{p.digit}</span>
                    <span className="text-[10px] font-mono text-slate-300">
                      {(p.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* COLUMN 2: Cleaned Input */}
          {/* ============================================================== */}
          <div className="bg-slate-950/90 rounded-2xl border border-emerald-500/40 p-5 flex flex-col gap-4 shadow-xl ring-1 ring-emerald-500/20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-300">
                  B. Run on Auto-Cleaned Input
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                α = 1.8 + Otsu Binarized
              </span>
            </div>

            {/* Canvas Preview */}
            <div className="flex items-center justify-center py-2">
              <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-lg">
                <canvas
                  ref={canvasCleanRef}
                  width={128}
                  height={128}
                  className="w-28 h-28 object-cover bg-black"
                />
              </div>
            </div>

            {/* Prediction Output Badge */}
            <div className="bg-emerald-950/30 rounded-xl border border-emerald-500/40 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400">
                  Prediction
                </span>
                <p className="text-base font-bold text-white">
                  Digit <span className="text-emerald-400 font-mono">{cleanClass.topPrediction.digit}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400">
                  Confidence
                </span>
                <p className="text-base font-mono font-bold text-emerald-400">
                  {(cleanClass.topPrediction.probability * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Runner up & Status */}
            <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Uncertainty state:</span>
                <span className="text-emerald-300 font-semibold">Decisive / Sharp</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence Gain:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  +{((cleanClass.topPrediction.probability - blurryClass.topPrediction.probability) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Probability Bars */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] uppercase font-mono text-slate-400">
                Probability Spread (Digits 0-9)
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {cleanClass.probabilities.map((p) => {
                  const isWinner = p.digit === cleanClass.topPrediction.digit;
                  return (
                    <div
                      key={p.digit}
                      className={`p-1 rounded flex flex-col items-center ${
                        isWinner
                          ? 'bg-emerald-600/30 border border-emerald-500/60'
                          : 'bg-slate-900 border border-slate-800'
                      }`}
                    >
                      <span className="text-[9px] text-slate-400">D{p.digit}</span>
                      <span
                        className={`text-[10px] font-mono ${
                          isWinner ? 'text-emerald-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {(p.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Unsharp Masking ($\alpha = 1.8$) accentuates high-frequency edge gradients, providing strong filter activations for decisive Softmax classification.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => {
                onApplyCleaned(cleanedImg, optimalThreshold);
                onClose();
              }}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Apply Cleaned Input to Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
