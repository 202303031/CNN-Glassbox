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
import { Layers, Sliders, ArrowDownRight } from 'lucide-react';

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
  onToggleNormalize?: () => void;
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
  onToggleNormalize,
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

  const formatValue = (val: number) => {
    if (normalize) {
      return val.toFixed(2);
    }
    return Math.round(val).toString();
  };

  // Dynamic font size scaling so numbers like "255" or "1.00" never truncate or overlap borders
  const getDynamicStyle = (valStr: string, isSmallGrid: boolean) => {
    const len = valStr.length;
    if (isSmallGrid) {
      // 11x11 or smaller grid has larger cells
      if (len <= 2) return 'text-[11px] font-bold';
      if (len === 3) return 'text-[9.5px] font-bold tracking-tight';
      return 'text-[8.5px] font-semibold tracking-tighter';
    }
    // Larger grids (22x22 or 24x24)
    if (len <= 2) return 'text-[9.5px] font-bold';
    if (len === 3) return 'text-[8px] font-bold tracking-tighter';
    return 'text-[7px] font-semibold tracking-tighter';
  };

  const getInputCellBg = (val: number, isPadding: boolean) => {
    if (isPadding) return 'rgba(30, 41, 59, 0.45)';
    const norm = normalize ? val : val / 255;
    const clamped = Math.max(0, Math.min(1, norm));
    const intensity = Math.round(clamped * 235);
    return `rgb(${intensity}, ${intensity}, ${intensity})`;
  };

  /**
   * High contrast color mapping for Grid 2 (F_conv):
   * Dark background for 0, bright luminous amber/gold for positive values.
   */
  const getConvCellTheme = (val: number) => {
    if (val <= 0) {
      return {
        bg: 'rgba(9, 14, 26, 0.95)',
        textClass: 'text-slate-500 font-normal',
        isLuminous: false,
      };
    }
    const maxRange = normalize ? 2.5 : 255;
    const t = Math.min(1, val / maxRange);

    if (t > 0.45) {
      // Very high positive: bright golden amber / yellow -> crisp dark text!
      const r = Math.round(230 + t * 25);
      const g = Math.round(150 + t * 70);
      const b = Math.round(20 + t * 40);
      return {
        bg: `rgb(${r}, ${g}, ${b})`,
        textClass: 'text-slate-950 font-black',
        isLuminous: true,
      };
    } else {
      // Moderate positive: warm glowing bronze to amber
      const r = Math.round(40 + t * 190);
      const g = Math.round(25 + t * 125);
      const b = Math.round(15 + t * 5);
      return {
        bg: `rgb(${r}, ${g}, ${b})`,
        textClass: 'text-amber-200 font-bold',
        isLuminous: false,
      };
    }
  };

  /**
   * High contrast color mapping for Grid 3 (F_pool):
   * Dark background for 0, brilliant electric cyan/mint for high positive values.
   */
  const getPoolCellTheme = (val: number) => {
    if (val <= 0) {
      return {
        bg: 'rgba(6, 18, 24, 0.95)',
        textClass: 'text-slate-500 font-normal',
        isLuminous: false,
      };
    }
    const maxRange = normalize ? 2.5 : 255;
    const t = Math.min(1, val / maxRange);

    if (t > 0.45) {
      // High positive: brilliant radiant cyan/mint -> crisp dark text!
      const r = Math.round(30 + t * 70);
      const g = Math.round(200 + t * 55);
      const b = Math.round(220 + t * 35);
      return {
        bg: `rgb(${r}, ${g}, ${b})`,
        textClass: 'text-slate-950 font-black',
        isLuminous: true,
      };
    } else {
      // Moderate positive: deep ocean cyan to teal
      const r = Math.round(10 + t * 30);
      const g = Math.round(60 + t * 140);
      const b = Math.round(80 + t * 140);
      return {
        bg: `rgb(${r}, ${g}, ${b})`,
        textClass: 'text-cyan-200 font-bold',
        isLuminous: false,
      };
    }
  };

  const inputDim = paddedInput.length;
  const convDim = convMap.length;
  const poolDim = poolMap.length;

  return (
    <div className="w-full bg-slate-900/85 rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col gap-5">
      {/* Visualizer Header with Instructions & Normalization Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Interactive Numerical Matrix Grids (Bidirectional Receptive Fields)
            </h2>
            <p className="text-[11px] text-slate-400">
              Hover any cell in <span className="text-amber-400 font-semibold">F_conv</span> or <span className="text-emerald-400 font-semibold">F_pool</span> to highlight receptive fields and inspect exact math.
            </p>
          </div>
        </div>

        {/* Normalization Format Switch + Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {onToggleNormalize && (
            <button
              onClick={onToggleNormalize}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                normalize
                  ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-950/80 text-amber-300 border-amber-500/30 hover:border-amber-400'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Format:</span>
              <span className="font-mono underline">
                {normalize ? 'Normalized [0.00-1.00]' : 'Raw [0-255]'}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded border border-dashed border-slate-500 bg-slate-800 inline-block" />
              <span>Padded</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded border border-amber-400 bg-amber-500/40 inline-block" />
              <span>Conv Patch</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded border border-emerald-400 bg-emerald-500/40 inline-block" />
              <span>Pool Window</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Side-by-Side Matrix Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ============================================================== */}
        {/* GRID 1: Padded Preprocessed Input Matrix (I_pad)               */}
        {/* ============================================================== */}
        <div className="flex flex-col items-center bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 shadow-inner">
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
                  const valStr = formatValue(val);
                  const fontStyle = getDynamicStyle(valStr, inputDim <= 14);

                  let cellClasses =
                    'w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] flex items-center justify-center font-mono transition-all relative rounded-[2px] ';

                  if (isInConvPatch) {
                    cellClasses +=
                      'ring-2 ring-amber-400 z-10 shadow-lg shadow-amber-500/40 scale-110 ';
                  } else if (isInPoolReceptive) {
                    cellClasses +=
                      'ring-2 ring-emerald-400/80 z-10 shadow-md shadow-emerald-500/20 scale-105 ';
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
                      className={`${cellClasses} ${fontStyle}`}
                      style={{
                        backgroundColor: cellBg,
                      }}
                      title={`I_pad[${r}, ${c}] = ${val}${
                        isPadding ? ' (Zero-Padding Cell)' : ''
                      }`}
                    >
                      <span>{valStr}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 text-center">
            Padded borders in dashed gray; active receptive field patch in amber.
          </span>
        </div>

        {/* ============================================================== */}
        {/* GRID 2: Convolved + Activated Feature Map (F_conv)             */}
        {/* ============================================================== */}
        <div className="flex flex-col items-center bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30 shadow-inner ring-1 ring-amber-500/10">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-300">
                Grid 2: Convolved Map (<span className="text-amber-400 font-serif">F</span>
                <span className="text-[10px] text-slate-400 font-sans">conv</span>)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
              {convDim}×{convDim} (Stride S={convConfig.stride})
            </span>
          </div>

          <div className="overflow-auto max-w-full max-h-[380px] p-2 flex justify-center">
            {convDim === 0 ? (
              <div className="p-8 text-xs text-rose-400 text-center">
                Invalid spatial dimensions.
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

                    const theme = getConvCellTheme(val);
                    const valStr = formatValue(val);
                    const fontStyle = getDynamicStyle(valStr, convDim <= 14);

                    let cellClasses =
                      'w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] flex items-center justify-center font-mono transition-all relative rounded-[2px] cursor-pointer ';

                    let dynamicBg = theme.bg;
                    let textClass = theme.textClass;

                    if (isHoveredConv) {
                      cellClasses +=
                        'ring-2 ring-amber-300 z-20 shadow-lg shadow-amber-500/50 scale-115 ';
                      dynamicBg = '#f59e0b';
                      textClass = 'text-slate-950 font-black';
                    } else if (isWinningMax) {
                      cellClasses +=
                        'ring-2 ring-yellow-300 z-15 shadow-md scale-110 ';
                      dynamicBg = '#fbbf24';
                      textClass = 'text-slate-950 font-black';
                    } else if (isInPoolWindow) {
                      cellClasses +=
                        'ring-2 ring-emerald-400/90 z-10 scale-105 ';
                      dynamicBg = 'rgba(16, 185, 129, 0.4)';
                      textClass = 'text-white font-black';
                    }

                    return (
                      <div
                        key={`conv-${r}-${c}`}
                        onMouseEnter={() =>
                          onHover({ type: 'conv', r, c })
                        }
                        onMouseLeave={() => onHover({ type: null })}
                        className={`${cellClasses} ${fontStyle} ${textClass}`}
                        style={{
                          backgroundColor: dynamicBg,
                        }}
                        title={`F_conv[${r}, ${c}] = ${val}`}
                      >
                        <span>{valStr}</span>
                        {isWinningMax && (
                          <span className="absolute -top-1 -right-1 text-[7px] text-yellow-300 font-black drop-shadow">
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
            Dark background for 0; radiant glowing amber for high edge activations.
          </span>
        </div>

        {/* ============================================================== */}
        {/* GRID 3: Pooled Output Feature Map (F_pool)                     */}
        {/* ============================================================== */}
        <div className="flex flex-col items-center bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 shadow-inner ring-1 ring-emerald-500/10">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-300">
                Grid 3: Pooled Output (<span className="text-emerald-400 font-serif">F</span>
                <span className="text-[10px] text-slate-400 font-sans">pool</span>)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                {poolDim}×{poolDim} ({poolConfig.mode})
              </span>
            </div>
          </div>

          {/* Spatial Downsampling Alert Pill */}
          <div className="w-full mb-2 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[10px] text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-emerald-400" />
              <span>Downsampling Factor: <strong>2× (50% Shrink)</strong></span>
            </div>
            <span className="font-mono text-slate-400">
              {convDim}×{convDim} → {poolDim}×{poolDim}
            </span>
          </div>

          <div className="overflow-auto max-w-full max-h-[380px] p-2 flex justify-center">
            {poolDim === 0 ? (
              <div className="p-8 text-xs text-rose-400 text-center">
                Pool window ({poolConfig.windowSize}×{poolConfig.windowSize}) is larger than conv map.
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

                    const theme = getPoolCellTheme(val);
                    const valStr = formatValue(val);
                    // Pool cells are fewer (e.g. 11x11), so they are comfortably larger (22px)
                    const fontStyle = getDynamicStyle(valStr, true);

                    let cellClasses =
                      'w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] flex items-center justify-center font-mono transition-all relative rounded-[3px] cursor-pointer ';

                    let dynamicBg = theme.bg;
                    let textClass = theme.textClass;

                    if (isHoveredPool) {
                      cellClasses +=
                        'ring-2 ring-emerald-300 z-20 shadow-lg shadow-emerald-500/50 scale-115 ';
                      dynamicBg = '#10b981';
                      textClass = 'text-slate-950 font-black';
                    }

                    return (
                      <div
                        key={`pool-${r}-${c}`}
                        onMouseEnter={() =>
                          onHover({ type: 'pool', r, c })
                        }
                        onMouseLeave={() => onHover({ type: null })}
                        className={`${cellClasses} ${fontStyle} ${textClass}`}
                        style={{
                          backgroundColor: dynamicBg,
                        }}
                        title={`F_pool[${r}, ${c}] = ${val} (${poolConfig.mode})`}
                      >
                        <span>{valStr}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-2 text-center">
            Non-overlapping pool stride (S_p=2) shrinks {convDim}×{convDim} to {poolDim}×{poolDim}.
          </span>
        </div>
      </div>
    </div>
  );
};
