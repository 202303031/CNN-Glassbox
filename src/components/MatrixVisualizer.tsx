import React from 'react';
import type {
  Matrix2D,
  ConvolutionConfig,
  PoolingConfig,
  HoverState,
  ConvStepDetail,
  PoolStepDetail,
} from '../types/cnn';
import {
  getInputWindowForConvCell,
  getConvWindowForPoolCell,
  getFullReceptiveFieldForPool,
} from '../utils/cnnEngine';
import { Layers } from 'lucide-react';

interface MatrixVisualizerProps {
  paddedInput: Matrix2D;
  padding: number;
  convMap: Matrix2D;
  poolMap: Matrix2D;
  convConfig: ConvolutionConfig;
  poolConfig: PoolingConfig;
  hoverState: HoverState;
  onHover: (state: HoverState) => void;
  normalize: boolean;
  activeConvStep?: ConvStepDetail;
  activePoolStep?: PoolStepDetail;
}

export const MatrixVisualizer: React.FC<MatrixVisualizerProps> = ({
  paddedInput,
  padding,
  convMap,
  poolMap,
  convConfig,
  poolConfig,
  hoverState,
  onHover,
  normalize,
  activeConvStep,
  activePoolStep,
}) => {
  // Determine active highlight coordinates
  const activeConvR =
    hoverState.type === 'conv' ? hoverState.r : activeConvStep?.outR;
  const activeConvC =
    hoverState.type === 'conv' ? hoverState.c : activeConvStep?.outC;

  const activePoolR =
    hoverState.type === 'pool' ? hoverState.r : activePoolStep?.outR;
  const activePoolC =
    hoverState.type === 'pool' ? hoverState.c : activePoolStep?.outC;

  // Compute receptive field windows
  const convPatchWindow =
    activeConvR !== undefined && activeConvC !== undefined
      ? getInputWindowForConvCell(activeConvR, activeConvC, convConfig)
      : null;

  const poolConvWindow =
    activePoolR !== undefined && activePoolC !== undefined
      ? getConvWindowForPoolCell(activePoolR, activePoolC, poolConfig)
      : null;

  const poolFullInputWindow =
    activePoolR !== undefined && activePoolC !== undefined
      ? getFullReceptiveFieldForPool(activePoolR, activePoolC, convConfig, poolConfig)
      : null;

  // Winning cell in pooling
  const poolStepInfo =
    activePoolR !== undefined && activePoolC !== undefined && activePoolStep
      ? activePoolStep
      : null;

  // Dynamic cell sizing based on matrix dimension
  const getCellSizeClass = (size: number) => {
    if (size <= 8) return 'w-8 h-8 text-[11px]';
    if (size <= 14) return 'w-7 h-7 text-[10px]';
    if (size <= 18) return 'w-6 h-6 text-[9px]';
    if (size <= 24) return 'w-5 h-5 text-[8px]';
    return 'w-4 h-4 text-[7px]';
  };

  const formatValue = (val: number) => {
    if (normalize) {
      return val.toFixed(2);
    }
    return Math.round(val).toString();
  };

  const getInputCellBg = (val: number, isPadding: boolean) => {
    if (isPadding) return 'rgba(30, 41, 59, 0.4)';
    const norm = normalize ? val : val / 255;
    const clamped = Math.max(0, Math.min(1, norm));
    const intensity = Math.round(clamped * 230);
    return `rgb(${intensity}, ${intensity}, ${intensity})`;
  };

  const getConvCellBg = (val: number) => {
    if (val === 0) return 'rgba(15, 23, 42, 0.85)';
    if (val > 0) {
      const maxRange = normalize ? 2.5 : 255;
      const t = Math.min(1, val / maxRange);
      const r = Math.round(15 + t * 40);
      const g = Math.round(23 + t * 90);
      const b = Math.round(42 + t * 180);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const minRange = normalize ? -2.5 : -255;
      const t = Math.min(1, Math.abs(val) / Math.abs(minRange));
      const r = Math.round(15 + t * 120);
      const g = Math.round(23 + t * 20);
      const b = Math.round(42 + t * 30);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const getPoolCellBg = (val: number) => {
    const maxRange = normalize ? 2.5 : 255;
    const t = Math.min(1, Math.max(0, val / maxRange));
    const r = Math.round(6 + t * 16);
    const g = Math.round(78 + t * 140);
    const b = Math.round(59 + t * 90);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const inputDim = paddedInput.length;
  const convDim = convMap.length;
  const poolDim = poolMap.length;

  return (
    <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col gap-4">
      {/* Visualizer Header with Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Interactive Numerical Matrix Grids (Bidirectional Receptive Fields)
            </h2>
            <p className="text-[11px] text-slate-400">
              Hover any cell in <span className="text-amber-400 font-semibold">F_conv</span> or <span className="text-emerald-400 font-semibold">F_pool</span> to highlight receptive fields and inspect exact math.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-dashed border-slate-500 bg-slate-800/60 inline-block" />
            <span>Padded Border</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-amber-500 bg-amber-500/20 inline-block" />
            <span>Conv Patch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-emerald-500 bg-emerald-500/20 inline-block" />
            <span>Pool Window</span>
          </div>
        </div>
      </div>

      {/* 3 Side-by-Side Matrix Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ============================================================== */}
        {/* GRID 1: Padded Preprocessed Input Matrix (I_pad) */}
        {/* ============================================================== */}
        <div className="flex flex-col items-center bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/90 shadow-inner">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200">
                Grid 1: Padded Input (<span className="text-indigo-400 font-serif">I</span>
                <span className="text-[10px] text-slate-400 font-sans">pad</span>)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {inputDim}×{inputDim} (P={padding})
            </span>
          </div>

          <div className="overflow-auto max-w-full max-h-[380px] p-2 flex justify-center">
            <div
              className="grid gap-[2px] select-none"
              style={{
                gridTemplateColumns: `repeat(${inputDim}, minmax(0, 1fr))`,
              }}
            >
              {paddedInput.map((row, r) =>
                row.map((val, c) => {
                  const isPadding =
                    r < padding ||
                    r >= inputDim - padding ||
                    c < padding ||
                    c >= inputDim - padding;

                  const isInConvPatch =
                    convPatchWindow &&
                    r >= convPatchWindow.startR &&
                    r < convPatchWindow.startR + convPatchWindow.size &&
                    c >= convPatchWindow.startC &&
                    c < convPatchWindow.startC + convPatchWindow.size;

                  const isInPoolReceptive =
                    poolFullInputWindow &&
                    r >= poolFullInputWindow.startR &&
                    r <= poolFullInputWindow.endR &&
                    c >= poolFullInputWindow.startC &&
                    c <= poolFullInputWindow.endC;

                  const norm = normalize ? val : val / 255;
                  const isHighVal = norm > 0.45;
                  const cellBg = getInputCellBg(val, isPadding);

                  let cellClasses =
                    'flex items-center justify-center font-mono font-bold transition-all relative rounded-[3px] ';

                  if (isInConvPatch) {
                    cellClasses +=
                      'ring-2 ring-amber-400 z-10 shadow-lg shadow-amber-500/30 scale-105 ';
                  } else if (isInPoolReceptive) {
                    cellClasses +=
                      'ring-2 ring-emerald-400/80 z-10 shadow-md shadow-emerald-500/20 scale-102 ';
                  }

                  if (isPadding) {
                    cellClasses += 'border border-dashed border-slate-700/80 text-slate-500 ';
                  } else {
                    cellClasses += isHighVal ? 'text-black ' : 'text-white ';
                  }

                  return (
                    <div
                      key={`input-${r}-${c}`}
                      onMouseEnter={() =>
                        onHover({ type: 'input', r, c })
                      }
                      onMouseLeave={() => onHover({ type: null })}
                      className={`${getCellSizeClass(inputDim)} ${cellClasses}`}
                      style={{
                        backgroundColor: cellBg,
                      }}
                      title={`I_pad[${r}, ${c}] = ${val}${
                        isPadding ? ' (Zero-Padding Cell)' : ''
                      }`}
                    >
                      <span>{formatValue(val)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 text-center">
            Zero-padded borders in dashed gray; active receptive field patch in amber.
          </span>
        </div>

        {/* ============================================================== */}
        {/* GRID 2: Convolved + Activated Feature Map (F_conv) */}
        {/* ============================================================== */}
        <div className="flex flex-col items-center bg-slate-950/70 p-3.5 rounded-xl border border-amber-500/30 shadow-inner ring-1 ring-amber-500/10">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-300">
                Grid 2: Convolved Map (<span className="text-amber-400 font-serif">F</span>
                <span className="text-[10px] text-slate-400 font-sans">conv</span>)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30 text-amber-300">
              {convDim}×{convDim} (S={convConfig.stride})
            </span>
          </div>

          <div className="overflow-auto max-w-full max-h-[380px] p-2 flex justify-center">
            {convDim === 0 ? (
              <div className="p-8 text-xs text-rose-400 text-center">
                Invalid spatial dimensions (kernel/stride larger than input). Reduce stride or kernel size.
              </div>
            ) : (
              <div
                className="grid gap-[2px] select-none"
                style={{
                  gridTemplateColumns: `repeat(${convDim}, minmax(0, 1fr))`,
                }}
              >
                {convMap.map((row, r) =>
                  row.map((val, c) => {
                    const isHoveredConv =
                      activeConvR === r && activeConvC === c;

                    const isInPoolWindow =
                      poolConvWindow &&
                      r >= poolConvWindow.startR &&
                      r < poolConvWindow.startR + poolConvWindow.size &&
                      c >= poolConvWindow.startC &&
                      c < poolConvWindow.startC + poolConvWindow.size;

                    const isWinningMax =
                      isInPoolWindow &&
                      poolConfig.mode === 'max' &&
                      poolStepInfo?.winningR !== undefined &&
                      poolStepInfo?.winningC !== undefined &&
                      r === poolConvWindow!.startR + poolStepInfo.winningR &&
                      c === poolConvWindow!.startC + poolStepInfo.winningC;

                    let cellClasses =
                      'flex items-center justify-center font-mono font-bold transition-all relative rounded-[3px] cursor-pointer ';

                    if (isHoveredConv) {
                      cellClasses +=
                        'ring-2 ring-amber-400 bg-amber-500/40 text-white z-20 shadow-lg shadow-amber-500/40 scale-110 ';
                    } else if (isWinningMax) {
                      cellClasses +=
                        'ring-2 ring-yellow-300 bg-yellow-500/30 text-yellow-100 z-15 shadow-md scale-105 ';
                    } else if (isInPoolWindow) {
                      cellClasses +=
                        'ring-1 ring-emerald-400 bg-emerald-950/60 text-emerald-200 z-10 ';
                    } else {
                      cellClasses +=
                        val > 0
                          ? 'text-cyan-200 hover:ring-1 hover:ring-indigo-400 '
                          : 'text-slate-400 hover:ring-1 hover:ring-indigo-400 ';
                    }

                    const cellBg = getConvCellBg(val);

                    return (
                      <div
                        key={`conv-${r}-${c}`}
                        onMouseEnter={() =>
                          onHover({ type: 'conv', r, c })
                        }
                        onMouseLeave={() => onHover({ type: null })}
                        className={`${getCellSizeClass(convDim)} ${cellClasses}`}
                        style={{
                          backgroundColor:
                            isHoveredConv || isInPoolWindow ? undefined : cellBg,
                        }}
                        title={`F_conv[${r}, ${c}] = ${val}`}
                      >
                        <span>{formatValue(val)}</span>
                        {isWinningMax && (
                          <span className="absolute -top-1 -right-1 text-[7px] text-yellow-300 font-extrabold">
                            ★
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-2 text-center">
            Hover to slide kernel over Input; active window highlighted in yellow/emerald.
          </span>
        </div>

        {/* ============================================================== */}
        {/* GRID 3: Pooled Output Feature Map (F_pool) */}
        {/* ============================================================== */}
        <div className="flex flex-col items-center bg-slate-950/70 p-3.5 rounded-xl border border-emerald-500/30 shadow-inner ring-1 ring-emerald-500/10">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-300">
                Grid 3: Pooled Output (<span className="text-emerald-400 font-serif">F</span>
                <span className="text-[10px] text-slate-400 font-sans">pool</span>)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">
              {poolDim}×{poolDim} ({poolConfig.mode})
            </span>
          </div>

          <div className="overflow-auto max-w-full max-h-[380px] p-2 flex justify-center">
            {poolDim === 0 ? (
              <div className="p-8 text-xs text-rose-400 text-center">
                Pool window ({poolConfig.windowSize}×{poolConfig.windowSize}) is larger than conv map ({convDim}×{convDim}).
              </div>
            ) : (
              <div
                className="grid gap-[2px] select-none"
                style={{
                  gridTemplateColumns: `repeat(${poolDim}, minmax(0, 1fr))`,
                }}
              >
                {poolMap.map((row, r) =>
                  row.map((val, c) => {
                    const isHoveredPool =
                      activePoolR === r && activePoolC === c;

                    let cellClasses =
                      'flex items-center justify-center font-mono font-bold transition-all relative rounded-[3px] cursor-pointer ';

                    if (isHoveredPool) {
                      cellClasses +=
                        'ring-2 ring-emerald-300 bg-emerald-500/40 text-white z-20 shadow-lg shadow-emerald-500/40 scale-110 ';
                    } else {
                      cellClasses +=
                        'text-emerald-100 hover:ring-1 hover:ring-emerald-400 ';
                    }

                    const cellBg = getPoolCellBg(val);

                    return (
                      <div
                        key={`pool-${r}-${c}`}
                        onMouseEnter={() =>
                          onHover({ type: 'pool', r, c })
                        }
                        onMouseLeave={() => onHover({ type: null })}
                        className={`${getCellSizeClass(poolDim)} ${cellClasses}`}
                        style={{
                          backgroundColor: isHoveredPool ? undefined : cellBg,
                        }}
                        title={`F_pool[${r}, ${c}] = ${val} (${poolConfig.mode})`}
                      >
                        <span>{formatValue(val)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-2 text-center">
            Hover to inspect local pool window & winning max cell in F_conv.
          </span>
        </div>
      </div>
    </div>
  );
};
