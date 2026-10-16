import React, { useRef } from 'react';
import {
  Upload,
  Wand2,
  Sliders,
  PenTool,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import type { PreprocessConfig, ColorMode, NoiseReduction } from '../types/cnn';

interface PreprocessingPanelProps {
  config: PreprocessConfig;
  onChangeConfig: (newConfig: PreprocessConfig) => void;
  onSelectPreset: (presetId: 'street' | 'checkerboard' | 'digit8') => void;
  onOpenDrawModal: () => void;
  onUploadImage: (file: File) => void;
  onRunAutoOtsu: () => void;
  activePreset: string;
}

export const PreprocessingPanel: React.FC<PreprocessingPanelProps> = ({
  config,
  onChangeConfig,
  onSelectPreset,
  onOpenDrawModal,
  onUploadImage,
  onRunAutoOtsu,
  activePreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadImage(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col gap-5 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-slate-200 shadow-xl overflow-y-auto">
      {/* Panel Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-white tracking-wide">
            1. Preprocessing Stage
          </h2>
        </div>
        <button
          onClick={() => {
            onChangeConfig({
              colorMode: 'grayscale',
              threshold: 128,
              sharpenAlpha: 1.0,
              noiseReduction: 'none',
              normalize: false,
              targetSize: 16,
            });
          }}
          title="Reset preprocessing filters to defaults"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* SECTION 1: Image Source & Presets */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Source Image
        </label>

        {/* Drag and drop upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 bg-slate-950/60 hover:bg-slate-900/60 transition-all rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer group text-center"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUploadImage(e.target.files[0]);
              }
            }}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />
          <div className="p-2.5 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 transition-colors">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-200">
              Drop image here or <span className="text-indigo-400 underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or WebP</p>
          </div>
        </div>

        {/* 4 Procedural Presets */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={() => onSelectPreset('street')}
            className={`p-2 rounded-xl text-left border text-xs transition-all flex flex-col gap-1 ${
              activePreset === 'street'
                ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-100">Urban Scene</span>
              {activePreset === 'street' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
            <span className="text-[10px] text-slate-400">Gradients & lighting</span>
          </button>

          <button
            onClick={() => onSelectPreset('checkerboard')}
            className={`p-2 rounded-xl text-left border text-xs transition-all flex flex-col gap-1 ${
              activePreset === 'checkerboard'
                ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-100">Checkerboard</span>
              {activePreset === 'checkerboard' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
            <span className="text-[10px] text-slate-400">Sharp geometric edges</span>
          </button>

          <button
            onClick={() => onSelectPreset('digit8')}
            className={`p-2 rounded-xl text-left border text-xs transition-all flex flex-col gap-1 ${
              activePreset === 'digit8'
                ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-100">MNIST Digit '8'</span>
              {activePreset === 'digit8' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
            <span className="text-[10px] text-slate-400">Soft curved strokes</span>
          </button>

          <button
            onClick={onOpenDrawModal}
            className={`p-2 rounded-xl text-left border text-xs transition-all flex flex-col gap-1 ${
              activePreset === 'custom_draw'
                ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <PenTool className="w-3 h-3 text-indigo-400" />
                <span className="font-semibold text-slate-100">Draw Canvas</span>
              </div>
              {activePreset === 'custom_draw' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
            <span className="text-[10px] text-slate-400">Draw custom patterns</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-800" />

      {/* SECTION 2: Preprocessing Pipeline Filters */}
      <div className="flex flex-col gap-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Filter Controls & Chain
        </label>

        {/* 1. Color Mode Selector */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Color Mode</span>
            <span className="text-[10px] text-slate-400">Luminance / Binarization</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(
              [
                { id: 'grayscale', label: 'Grayscale' },
                { id: 'binary', label: 'B & W' },
                { id: 'inverted_binary', label: 'Inv B&W' },
              ] as { id: ColorMode; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => onChangeConfig({ ...config, colorMode: m.id })}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  config.colorMode === m.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {config.colorMode === 'grayscale'
              ? 'Y = 0.299R + 0.587G + 0.114B'
              : config.colorMode === 'binary'
              ? `Y ≥ ${config.threshold} ? 255 : 0`
              : `Y ≥ ${config.threshold} ? 0 : 255`}
          </p>
        </div>

        {/* 2. Binarization Threshold Slider with Auto Otsu Button */}
        <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Binarization Threshold</span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
              {config.threshold} / 255
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={255}
            value={config.threshold}
            onChange={(e) =>
              onChangeConfig({ ...config, threshold: Number(e.target.value) })
            }
            className="w-full accent-amber-500 cursor-pointer"
          />

          <button
            onClick={onRunAutoOtsu}
            className="mt-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all active:scale-95 shadow-sm"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            Auto Otsu Threshold
          </button>
        </div>

        {/* 3. De-blur / Sharpen Strength (alpha) */}
        <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">
              Sharpen Strength (<span className="italic font-serif">α</span>)
            </span>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
              {config.sharpenAlpha.toFixed(2)}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={3.0}
            step={0.1}
            value={config.sharpenAlpha}
            onChange={(e) =>
              onChangeConfig({ ...config, sharpenAlpha: Number(e.target.value) })
            }
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <p className="text-[10px] text-slate-400">
            Laplacian high-pass unsharp mask: center = 1 + 4α, neighbors = -α
          </p>
        </div>

        {/* 4. Noise Reduction Toggle (None, Gaussian, Median) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Noise Reduction</span>
            <span className="text-[10px] text-slate-400">Pre-smoothing</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(
              [
                { id: 'none', label: 'None' },
                { id: 'gaussian', label: 'Gaussian' },
                { id: 'median', label: 'Median' },
              ] as { id: NoiseReduction; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => onChangeConfig({ ...config, noiseReduction: item.id })}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  config.noiseReduction === item.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. CNN Input Matrix Downsample Size */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">CNN Input Resolution (I)</span>
            <span className="text-[10px] text-slate-400">Area Averaging</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[12, 16, 24].map((size) => (
              <button
                key={size}
                onClick={() => onChangeConfig({ ...config, targetSize: size })}
                className={`py-1.5 text-xs font-mono font-semibold rounded-lg transition-all ${
                  config.targetSize === size
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
