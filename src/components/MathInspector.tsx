import React from 'react';
import type {
  ConvStepDetail,
  PoolStepDetail,
  ConvolutionConfig,
  PoolingConfig,
} from '../types/cnn';
import { Calculator, Sigma } from 'lucide-react';

interface MathInspectorProps {
  inputSize: number;
  convConfig: ConvolutionConfig;
  poolConfig: PoolingConfig;
  activeConvStep?: ConvStepDetail;
  activePoolStep?: PoolStepDetail;
  normalize: boolean;
  hoverType: 'conv' | 'pool' | 'input' | null;
}

export const MathInspector: React.FC<MathInspectorProps> = ({
  inputSize,
  convConfig,
  poolConfig,
  activeConvStep,
  activePoolStep,
  normalize,
  hoverType,
}) => {
  const { kernelSize, padding, stride } = convConfig;
  const { windowSize: Kp, stride: Sp } = poolConfig;

  // Spatial dimension calculations
  const convNumerator = inputSize - kernelSize + 2 * padding;
  const convOutCalc = Math.floor(convNumerator / stride) + 1;

  const poolNumerator = convOutCalc - Kp;
  const poolOutCalc = Math.floor(poolNumerator / Sp) + 1;

  const formatNum = (n: number) => {
    if (normalize) return n.toFixed(2);
    return Math.round(n * 10) / 10;
  };

  return (
    <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-800 p-5 text-slate-200 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Live Mathematical Inspector & Spatial Dimension Engine
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time matrix dot products, bias summation, activation functions, and pooling reductions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/20">
            Precision: {normalize ? 'Normalized Floats' : 'Integer Pixels'}
          </span>
        </div>
      </div>

      {/* Part 1: Spatial Dimension Formula Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Convolution Spatial Formula */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">
              1. Convolution Output Formula (O_conv)
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {convOutCalc}×{convOutCalc}
            </span>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">
            <p className="text-[11px] text-slate-400 mb-1">
              O_conv = ⌊ (I - K + 2P) / S ⌋ + 1
            </p>
            <p className="text-amber-200 font-semibold">
              = ⌊ ({inputSize} - {kernelSize} + 2·{padding}) / {stride} ⌋ + 1
              <span className="text-white"> = ⌊ {convNumerator} / {stride} ⌋ + 1</span>
              <span className="text-amber-400 font-bold"> = {convOutCalc}</span>
            </p>
          </div>
        </div>

        {/* Pooling Spatial Formula */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300">
              2. Pooling Output Formula (O_pool)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {poolOutCalc}×{poolOutCalc}
            </span>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">
            <p className="text-[11px] text-slate-400 mb-1">
              O_pool = ⌊ (O_conv - K_p) / S_p ⌋ + 1
            </p>
            <p className="text-emerald-200 font-semibold">
              = ⌊ ({convOutCalc} - {Kp}) / {Sp} ⌋ + 1
              <span className="text-white"> = ⌊ {poolNumerator} / {Sp} ⌋ + 1</span>
              <span className="text-emerald-400 font-bold"> = {poolOutCalc}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Part 2: Detailed Matrix Arithmetic Breakdown */}
      {hoverType === 'pool' && activePoolStep ? (
        /* POOLING BREAKDOWN */
        <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">
                Active Pooling Cell: F_pool[{activePoolStep.outR}, {activePoolStep.outC}]
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Window: ({activePoolStep.windowR}, {activePoolStep.windowC}) on F_conv
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Window Matrix */}
            <div className="flex flex-col items-center bg-slate-900/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 mb-2 font-medium">
                Window Values (Kp={activePoolStep.windowSize}×{activePoolStep.windowSize})
              </span>
              <div
                className="grid gap-1.5 p-1.5 bg-slate-950 rounded-lg border border-slate-700/80"
                style={{
                  gridTemplateColumns: `repeat(${activePoolStep.windowSize}, minmax(0, 1fr))`,
                }}
              >
                {activePoolStep.values.map((row, wr) =>
                  row.map((val, wc) => {
                    const isWinning =
                      activePoolStep.mode === 'max' &&
                      activePoolStep.winningR === wr &&
                      activePoolStep.winningC === wc;

                    return (
                      <div
                        key={`pool-win-${wr}-${wc}`}
                        className={`w-12 h-10 flex flex-col items-center justify-center font-mono text-xs font-bold rounded ${
                          isWinning
                            ? 'bg-yellow-500/30 ring-2 ring-yellow-400 text-yellow-200'
                            : 'bg-slate-900 text-slate-200 border border-slate-800'
                        }`}
                      >
                        <span>{formatNum(val)}</span>
                        {isWinning && (
                          <span className="text-[8px] text-yellow-300">WINNER</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Arithmetic Reduction Step */}
            <div className="flex flex-col gap-2 font-mono text-xs bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider">
                Reduction Operation: {activePoolStep.mode.toUpperCase()} POOLING
              </span>

              {activePoolStep.mode === 'max' ? (
                <div className="flex flex-col gap-1.5">
                  <p className="text-slate-300">
                    max({' '}
                    {activePoolStep.values.flat().map((v, i, arr) => (
                      <span key={i}>
                        <span
                          className={
                            v === activePoolStep.outputValue
                              ? 'text-yellow-300 font-bold underline'
                              : 'text-slate-400'
                          }
                        >
                          {formatNum(v)}
                        </span>
                        {i < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}{' '}
                    )
                  </p>
                  <p className="text-emerald-300 font-bold text-sm">
                    ⟹ Output Value = {formatNum(activePoolStep.outputValue)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <p className="text-slate-300">
                    mean = ({' '}
                    {activePoolStep.values.flat().map((v, i, arr) => (
                      <span key={i}>
                        {formatNum(v)}
                        {i < arr.length - 1 ? ' + ' : ''}
                      </span>
                    ))}{' '}
                    ) / {activePoolStep.values.flat().length}
                  </p>
                  <p className="text-emerald-300 font-bold text-sm">
                    ⟹ Output Value = {formatNum(activePoolStep.outputValue)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeConvStep ? (
        /* CONVOLUTION ELEMENT-WISE BREAKDOWN */
        <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-bold text-amber-300">
                Active Conv Cell: F_conv[{activeConvStep.outR}, {activeConvStep.outC}]
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Patch Top-Left on I_pad: ({activeConvStep.patchR}, {activeConvStep.patchC})
            </span>
          </div>

          {/* Element-wise Multiplication Matrix Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-2 items-center text-center">
            {/* Matrix 1: Receptive Field Patch */}
            <div className="md:col-span-3 flex flex-col items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-300 mb-1.5">
                Input Patch ({activeConvStep.kernel.length}×{activeConvStep.kernel.length})
              </span>
              <div
                className="grid gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800"
                style={{
                  gridTemplateColumns: `repeat(${activeConvStep.kernel.length}, minmax(0, 1fr))`,
                }}
              >
                {activeConvStep.patch.map((row, r) =>
                  row.map((val, c) => (
                    <div
                      key={`p-${r}-${c}`}
                      className="w-8 h-8 flex items-center justify-center font-mono text-[10px] font-bold bg-slate-900 border border-slate-800 rounded text-slate-200"
                    >
                      {formatNum(val)}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Symbol: Hadamard Product */}
            <div className="md:col-span-1 text-slate-400 font-bold text-lg">
              ⊙
            </div>

            {/* Matrix 2: Kernel Weights */}
            <div className="md:col-span-3 flex flex-col items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-indigo-300 mb-1.5">
                Weights W ({activeConvStep.kernel.length}×{activeConvStep.kernel.length})
              </span>
              <div
                className="grid gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800"
                style={{
                  gridTemplateColumns: `repeat(${activeConvStep.kernel.length}, minmax(0, 1fr))`,
                }}
              >
                {activeConvStep.kernel.map((row, r) =>
                  row.map((val, c) => (
                    <div
                      key={`w-${r}-${c}`}
                      className="w-8 h-8 flex items-center justify-center font-mono text-[10px] font-bold bg-indigo-950/40 border border-indigo-500/30 rounded text-indigo-300"
                    >
                      {val}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Symbol: Equals */}
            <div className="md:col-span-1 text-slate-400 font-bold text-lg">
              =
            </div>

            {/* Matrix 3: Products */}
            <div className="md:col-span-3 flex flex-col items-center bg-slate-900/60 p-2.5 rounded-xl border border-amber-500/20">
              <span className="text-[11px] font-semibold text-amber-300 mb-1.5">
                Products Matrix
              </span>
              <div
                className="grid gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800"
                style={{
                  gridTemplateColumns: `repeat(${activeConvStep.kernel.length}, minmax(0, 1fr))`,
                }}
              >
                {activeConvStep.products.map((row, r) =>
                  row.map((val, c) => (
                    <div
                      key={`prod-${r}-${c}`}
                      className="w-8 h-8 flex items-center justify-center font-mono text-[9px] font-bold bg-amber-950/30 border border-amber-500/30 rounded text-amber-200"
                    >
                      {formatNum(val)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Summation, Bias, Activation Pipeline */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <Sigma className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">Sum of Products:</span>
              <span className="font-bold text-white">{formatNum(activeConvStep.sum)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">+ Bias ({activeConvStep.bias}):</span>
              <span className="font-bold text-indigo-300">
                = {formatNum(activeConvStep.preActivation)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">
                Activation ({activeConvStep.activation}):
              </span>
              <span className="font-bold text-emerald-400 text-sm">
                = {formatNum(activeConvStep.outputValue)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-950/50 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
          Hover over any cell in the Convolved Map or Pooled Map, or press Play to inspect the live matrix arithmetic.
        </div>
      )}
    </div>
  );
};
