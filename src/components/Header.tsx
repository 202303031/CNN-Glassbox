import React from 'react';
import { Layers, Sliders, Cpu } from 'lucide-react';

interface HeaderProps {
  inputSize: number;
  convSize: number;
  poolSize: number;
  normalize: boolean;
  onToggleNormalize: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  inputSize,
  convSize,
  poolSize,
  normalize,
  onToggleNormalize,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 sticky top-0 z-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white m-0">
                CNN Glassbox
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-medium">
                v2.0 Visualizer
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">
              Interactive Image Preprocessing & 2D Convolution / Pooling Receptive Field Engine
            </p>
          </div>
        </div>

        {/* Pipeline Dimensions & Mode Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Dimension flow badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Dimensions:</span>
            <span className="font-mono text-indigo-300 font-semibold">{inputSize}×{inputSize}</span>
            <span className="text-slate-500">→</span>
            <span className="font-mono text-amber-300 font-semibold">{convSize}×{convSize}</span>
            <span className="text-slate-500">→</span>
            <span className="font-mono text-emerald-300 font-semibold">{poolSize}×{poolSize}</span>
          </div>

          {/* Normalization switch */}
          <button
            onClick={onToggleNormalize}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              normalize
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Format:</span>
            <span className="font-mono font-bold">
              {normalize ? 'Floats [0.00, 1.00]' : 'Integers [0, 255]'}
            </span>
          </button>

          {/* Status indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium">Live Math Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
