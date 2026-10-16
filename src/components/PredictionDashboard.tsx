import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ClassificationResult, Matrix2D } from '../types/cnn';

interface PredictionDashboardProps {
  classification: ClassificationResult;
  poolMap: Matrix2D;
  normalize: boolean;
}

export const PredictionDashboard: React.FC<PredictionDashboardProps> = ({
  classification,
  poolMap,
  normalize,
}) => {
  const [showFullVector, setShowFullVector] = useState(false);
  const [hoveredDigit, setHoveredDigit] = useState<number | null>(null);

  const {
    flattenedVector,
    probabilities,
    topPrediction,
    secondPrediction,
    multiDigitResult,
  } = classification;

  const poolDim = poolMap.length;
  const totalCells = poolDim * poolDim;

  // Format value helper
  const formatVal = (v: number) => {
    if (normalize) return v.toFixed(2);
    return Math.round(v).toString();
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-indigo-500/30 p-5 shadow-2xl flex flex-col gap-6 ring-1 ring-indigo-500/20">
      {/* 1. Header with Stage Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Stage 4: Digit Classification Engine (Dense & Softmax)
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                10-Class MNIST
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Answers <span className="text-indigo-300 font-semibold">"What number is this?"</span> by flattening Grid 3 ($F_{`{pool}`}$) into a feature vector and calculating Softmax class likelihoods.
            </p>
          </div>
        </div>

        {/* Multi-digit alert pill if detected */}
        {multiDigitResult?.isMultiDigit && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>Multi-Digit Detected:</span>
            <span className="font-mono text-purple-300 font-bold bg-purple-900/80 px-2 py-0.5 rounded">
              [{multiDigitResult.detectedDigits.join(', ')}]
            </span>
          </div>
        )}
      </div>

      {/* 2. Top Prediction Hero Banner & Confidence Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Main Winner Badge */}
        <div className="md:col-span-7 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 rounded-xl border border-indigo-500/40 p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Live Prediction Output
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/30">
                ArgMax
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Confidence:{' '}
              <span className="font-mono font-bold text-emerald-400">
                {(topPrediction.probability * 100).toFixed(1)}%
              </span>
            </span>
          </div>

          <div className="flex items-center gap-6 my-1">
            {/* Glowing Big Digit Box */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 p-0.5 shadow-xl shadow-indigo-500/30 ring-2 ring-indigo-400/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-100 to-indigo-300 font-mono">
                  {topPrediction.digit}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">
                  Predicted Digit: <span className="text-indigo-400 font-mono">{topPrediction.digit}</span>
                </span>
                <CheckCircle className="w-4 h-4 text-emerald-400 inline" />
              </div>

              {/* Confidence Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/60 p-[1px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.max(5, topPrediction.probability * 100)}%` }}
                />
              </div>

              {/* Runner-up Candidate */}
              <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                <span>
                  Runner-up:{' '}
                  <span className="font-semibold text-amber-300 font-mono">
                    Digit {secondPrediction.digit}
                  </span>{' '}
                  ({(secondPrediction.probability * 100).toFixed(1)}%)
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  Logit z_{topPrediction.digit} = {topPrediction.rawLogit.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-digit / Component Sub-classification Card */}
        <div className="md:col-span-5 bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Connected Component Scan</span>
            <span className="text-[10px] font-mono text-slate-400">
              {multiDigitResult?.isMultiDigit
                ? `${multiDigitResult.boxes.length} Digits Detected`
                : 'Single Digit Detected'}
            </span>
          </div>

          {multiDigitResult?.isMultiDigit ? (
            <div className="flex flex-col gap-2 my-2">
              <p className="text-[11px] text-slate-400">
                Segmented disconnected bounding boxes sorted left-to-right:
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {multiDigitResult.boxes.map((box, idx) => (
                  <div
                    key={box.id}
                    className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs"
                  >
                    <span className="text-slate-400 text-[10px]">Digit #{idx + 1}:</span>
                    <span className="font-mono font-bold text-white text-sm bg-indigo-600/60 px-1.5 rounded">
                      {box.digit}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-mono">
                      {box.confidence}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="my-2 flex flex-col gap-1 text-xs text-slate-400">
              <p>Continuous stroke geometry detected. Ready for single-digit classification.</p>
              <p className="text-[11px] text-slate-400">
                Tip: Draw or load multiple digits (e.g. <span className="text-indigo-300 font-mono font-semibold">"69"</span>) to auto-split bounding boxes.
              </p>
            </div>
          )}

          {/* Softmax Formula Reminder */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>P(k) = e^(z_k) / ∑ e^(z_j)</span>
            <span className="text-emerald-400">∑ P = 100.0%</span>
          </div>
        </div>
      </div>

      {/* 3. Class Probability Bar Chart (Digits 0 through 9) */}
      <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-4 shadow-inner flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              10-Class Softmax Probability Distribution (0 – 9)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {hoveredDigit !== null
              ? `Inspecting Digit ${hoveredDigit}: P=${(probabilities[hoveredDigit].probability * 100).toFixed(1)}%, Logit=${probabilities[hoveredDigit].rawLogit.toFixed(1)}`
              : 'Top 2 candidates highlighted in amber & cyan'}
          </span>
        </div>

        {/* 10 Interactive Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {probabilities.map((pred) => {
            const isTop = pred.digit === topPrediction.digit;
            const isSecond = pred.digit === secondPrediction.digit;
            const pct = (pred.probability * 100).toFixed(1);

            let borderClass = 'border-slate-800 bg-slate-900/60';
            let barColor = 'bg-slate-700';
            let textColor = 'text-slate-300';
            let badgeColor = 'bg-slate-800 text-slate-400';

            if (isTop) {
              borderClass = 'border-indigo-500/70 bg-indigo-950/50 ring-1 ring-indigo-500/40';
              barColor = 'bg-gradient-to-r from-indigo-500 to-cyan-400';
              textColor = 'text-white font-bold';
              badgeColor = 'bg-indigo-600 text-white font-bold';
            } else if (isSecond) {
              borderClass = 'border-amber-500/50 bg-amber-950/30 ring-1 ring-amber-500/30';
              barColor = 'bg-gradient-to-r from-amber-600 to-yellow-400';
              textColor = 'text-amber-200 font-semibold';
              badgeColor = 'bg-amber-600 text-white';
            }

            return (
              <div
                key={pred.digit}
                onMouseEnter={() => setHoveredDigit(pred.digit)}
                onMouseLeave={() => setHoveredDigit(null)}
                className={`p-2.5 rounded-xl border ${borderClass} flex flex-col gap-1.5 transition-all cursor-pointer hover:border-slate-600`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded flex items-center justify-center font-mono text-xs ${badgeColor}`}>
                      {pred.digit}
                    </span>
                    <span className={`text-xs ${textColor}`}>
                      Digit {pred.digit}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {pct}%
                  </span>
                </div>

                {/* Bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 p-[0.5px]">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-300`}
                    style={{ width: `${Math.max(2, pred.probability * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>z_{pred.digit}: {pred.rawLogit.toFixed(1)}</span>
                  {isTop && <span className="text-indigo-400 font-semibold">★ Winner</span>}
                  {isSecond && <span className="text-amber-400 font-semibold">2nd</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Flattening Step Visualizer (2D Pooled Matrix -> 1D Vector) */}
      <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 shadow-inner flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 tracking-wide">
              Flattening Transition: 2D Grid ({poolDim}×{poolDim} = {totalCells} Cells) → 1D Feature Vector (121×1)
            </h3>
          </div>

          <button
            onClick={() => setShowFullVector(!showFullVector)}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <span>{showFullVector ? 'Collapse Vector' : 'Expand All 121 Vector Values'}</span>
            {showFullVector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Visual Connector Diagram */}
        <div className="flex items-center justify-center gap-3 py-2 text-xs font-mono text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <span>F_pool ({poolDim}×{poolDim})</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-semibold">
            <span>Vectorize x = vec(F_pool)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
            <span>121 Features</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 font-semibold">
            <span>W · x + b (10 Logits)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-400/40 text-white font-bold">
            <span>Softmax Probabilities</span>
          </div>
        </div>

        {/* Micro-heatmap Strip of 121 flattened cells */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>x[0]</span>
            <span className="text-slate-400">121 Feature Cells (Hover to inspect value)</span>
            <span>x[120]</span>
          </div>

          <div className="w-full flex h-6 rounded-lg overflow-hidden border border-slate-700/80 p-[1px] bg-slate-900 gap-[1px]">
            {flattenedVector.slice(0, 121).map((val, idx) => {
              const r = Math.floor(idx / 11);
              const c = idx % 11;
              const intensity = normalize ? Math.min(1, val) : Math.min(1, val / 255);
              const t = Math.max(0, intensity);
              const bg = `rgb(${Math.round(15 + t * 40)}, ${Math.round(30 + t * 180)}, ${Math.round(60 + t * 180)})`;

              return (
                <div
                  key={idx}
                  className="flex-1 h-full hover:scale-125 hover:z-20 transition-all rounded-[1px] cursor-pointer"
                  style={{ backgroundColor: bg }}
                  title={`x[${idx}] = ${formatVal(val)} (from F_pool[${r}, ${c}])`}
                />
              );
            })}
          </div>
        </div>

        {/* Expanded 1D Array Table if requested */}
        {showFullVector && (
          <div className="max-h-48 overflow-y-auto p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[10px] font-mono grid grid-cols-6 sm:grid-cols-11 gap-1">
            {flattenedVector.slice(0, 121).map((val, idx) => (
              <div
                key={idx}
                className="p-1 rounded bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center"
              >
                <span className="text-slate-400 text-[8px]">x[{idx}]</span>
                <span className="text-cyan-300 font-bold">{formatVal(val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
