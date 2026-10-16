import React from 'react';
import { Cpu, Minimize2 } from 'lucide-react';
import type {
  ConvolutionConfig,
  PoolingConfig,
  ActivationFunction,
  PoolingMode,
} from '../types/cnn';
import {
  KERNEL_PRESETS_3X3,
  KERNEL_PRESETS_5X5,
} from '../utils/presets';
import type { KernelPreset } from '../utils/presets';

interface KernelControlsProps {
  convConfig: ConvolutionConfig;
  onChangeConvConfig: (config: ConvolutionConfig) => void;
  poolConfig: PoolingConfig;
  onChangePoolConfig: (config: PoolingConfig) => void;
  normalize: boolean;
}

export const KernelControls: React.FC<KernelControlsProps> = ({
  convConfig,
  onChangeConvConfig,
  poolConfig,
  onChangePoolConfig,
  normalize,
}) => {
  const currentPresets =
    convConfig.kernelSize === 3 ? KERNEL_PRESETS_3X3 : KERNEL_PRESETS_5X5;

  const handleSelectPreset = (preset: KernelPreset) => {
    onChangeConvConfig({
      ...convConfig,
      kernel: preset.weights.map((row) => [...row]),
    });
  };

  const handleWeightChange = (r: number, c: number, valueStr: string) => {
    const val = parseFloat(valueStr) || 0;
    const newKernel = convConfig.kernel.map((row, ri) =>
      row.map((colVal, ci) => (ri === r && ci === c ? val : colVal))
    );
    onChangeConvConfig({
      ...convConfig,
      kernel: newKernel,
    });
  };

  const handleKernelSizeChange = (newSize: 3 | 5) => {
    if (newSize === convConfig.kernelSize) return;
    if (newSize === 3) {
      onChangeConvConfig({
        ...convConfig,
        kernelSize: 3,
        kernel: KERNEL_PRESETS_3X3[0].weights.map((r) => [...r]),
      });
    } else {
      onChangeConvConfig({
        ...convConfig,
        kernelSize: 5,
        kernel: KERNEL_PRESETS_5X5[0].weights.map((r) => [...r]),
      });
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 text-slate-200 shadow-xl flex flex-col gap-5">
      {/* SECTION 1: Convolution Layer Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              2. Convolution Kernel (W) & Hyperparameters
            </h3>
          </div>

          {/* 3x3 vs 5x5 switch */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => handleKernelSizeChange(3)}
              className={`px-2 py-0.5 text-xs font-mono rounded font-semibold transition-all ${
                convConfig.kernelSize === 3
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3×3
            </button>
            <button
              onClick={() => handleKernelSizeChange(5)}
              className={`px-2 py-0.5 text-xs font-mono rounded font-semibold transition-all ${
                convConfig.kernelSize === 5
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              5×5
            </button>
          </div>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {currentPresets.map((preset) => {
            const isMatch =
              convConfig.kernel.length === preset.weights.length &&
              convConfig.kernel.every((row, r) =>
                row.every((val, c) => Math.abs(val - preset.weights[r][c]) < 0.001)
              );

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                  isMatch
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Editable Weight Grid & Sliders in a 2-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Interactive Weight Matrix Grid */}
          <div className="md:col-span-5 flex flex-col items-center bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 mb-2">
              Editable Weights Grid (W)
            </span>
            <div
              className="grid gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-700/60 shadow-inner"
              style={{
                gridTemplateColumns: `repeat(${convConfig.kernelSize}, minmax(0, 1fr))`,
              }}
            >
              {convConfig.kernel.map((row, r) =>
                row.map((weightVal, c) => (
                  <input
                    key={`${r}-${c}`}
                    type="number"
                    step={convConfig.kernelSize === 5 ? 0.01 : 1}
                    value={weightVal}
                    onChange={(e) => handleWeightChange(r, c, e.target.value)}
                    className="w-11 h-9 text-center bg-slate-950 border border-slate-700/70 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded text-xs font-mono font-bold text-slate-100 p-0 shadow-sm transition-all"
                  />
                ))
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-2 text-center">
              Click any cell to type custom float/integer weights
            </span>
          </div>

          {/* Hyperparameters Controls: Padding, Stride, Bias, Activation */}
          <div className="md:col-span-7 flex flex-col gap-2.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            {/* Padding Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  Padding (<span className="font-mono text-indigo-400 font-bold">P</span>):
                </span>
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
                  {convConfig.padding} cells
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                value={convConfig.padding}
                onChange={(e) =>
                  onChangeConvConfig({
                    ...convConfig,
                    padding: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">
                Rendered with dashed borders in input matrix
              </span>
            </div>

            {/* Stride Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  Convolution Stride (<span className="font-mono text-indigo-400 font-bold">S</span>):
                </span>
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
                  {convConfig.stride}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={4}
                value={convConfig.stride}
                onChange={(e) =>
                  onChangeConvConfig({
                    ...convConfig,
                    stride: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Bias Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  Bias (<span className="font-mono text-indigo-400 font-bold">b</span>):
                </span>
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
                  {convConfig.bias > 0 ? `+${convConfig.bias}` : convConfig.bias}
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={normalize ? 0.05 : 1}
                value={convConfig.bias}
                onChange={(e) =>
                  onChangeConvConfig({
                    ...convConfig,
                    bias: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Activation Function */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-300">Activation Function:</span>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/60">
                {(
                  [
                    { id: 'none', label: 'None' },
                    { id: 'relu', label: 'ReLU' },
                    { id: 'leaky_relu', label: 'Leaky ReLU' },
                  ] as { id: ActivationFunction; label: string }[]
                ).map((act) => (
                  <button
                    key={act.id}
                    onClick={() =>
                      onChangeConvConfig({ ...convConfig, activation: act.id })
                    }
                    className={`py-1 text-xs font-medium rounded transition-all ${
                      convConfig.activation === act.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-800" />

      {/* SECTION 2: Pooling Layer Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Minimize2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              3. Pooling Layer Controls (Downsampling)
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Mode: Max vs Average */}
          <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300 font-medium">Pooling Mode</span>
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/60">
              {(['max', 'average'] as PoolingMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChangePoolConfig({ ...poolConfig, mode })}
                  className={`py-1.5 text-xs font-semibold capitalize rounded transition-all ${
                    poolConfig.mode === mode
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400">
              {poolConfig.mode === 'max'
                ? 'Selects winning maximum value'
                : 'Computes window arithmetic mean'}
            </span>
          </div>

          {/* Window Size (Kp) */}
          <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Window Size (Kp)</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {poolConfig.windowSize}×{poolConfig.windowSize}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/60">
              {([2, 3] as (2 | 3)[]).map((sz) => (
                <button
                  key={sz}
                  onClick={() => onChangePoolConfig({ ...poolConfig, windowSize: sz })}
                  className={`py-1.5 text-xs font-mono font-semibold rounded transition-all ${
                    poolConfig.windowSize === sz
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sz}×{sz}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400">
              Local pooling kernel dimension
            </span>
          </div>

          {/* Stride (Sp) */}
          <div className="flex flex-col gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Pool Stride (Sp)</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {poolConfig.stride}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              value={poolConfig.stride}
              onChange={(e) =>
                onChangePoolConfig({
                  ...poolConfig,
                  stride: Number(e.target.value),
                })
              }
              className="w-full accent-emerald-500 cursor-pointer mt-1"
            />
            <span className="text-[10px] text-slate-400">
              Spatial jump between pool windows
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
