import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
} from 'lucide-react';

interface PlaybackBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentStepIndex: number;
  totalSteps: number;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  speedMs: number;
  onChangeSpeed: (ms: number) => void;
  stageMode: 'conv' | 'pool';
  onChangeStageMode: (mode: 'conv' | 'pool') => void;
  convStride?: number;
  poolStride?: number;
}

export const PlaybackBar: React.FC<PlaybackBarProps> = ({
  isPlaying,
  onTogglePlay,
  currentStepIndex,
  totalSteps,
  onStepForward,
  onStepBackward,
  onReset,
  speedMs,
  onChangeSpeed,
  stageMode,
  onChangeStageMode,
  convStride = 1,
  poolStride = 2,
}) => {
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onStepForward();
    }, speedMs);

    return () => clearInterval(interval);
  }, [isPlaying, speedMs, onStepForward]);

  const progressPercent =
    totalSteps > 1
      ? Math.round((currentStepIndex / (totalSteps - 1)) * 100)
      : 100;

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 text-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Stage Selector & Step Status */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Stage Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onChangeStageMode('conv')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              stageMode === 'conv'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Step Convolution (S={convStride})
          </button>
          <button
            onClick={() => onChangeStageMode('pool')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              stageMode === 'pool'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Step Pooling (S_p={poolStride} Non-Overlapping)
          </button>
        </div>

        {/* Step Index Badge */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Step:</span>
          <span className="font-bold text-white">
            {totalSteps > 0 ? currentStepIndex + 1 : 0}
          </span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400">{totalSteps}</span>
        </div>

        {/* Striding Note */}
        <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
          {stageMode === 'conv'
            ? `Advances by S=${convStride} cell(s)`
            : `Advances by S_p=${poolStride} cells (Non-Overlapping)`}
        </span>
      </div>

      {/* Playback Controls (Play, Prev, Next, Reset) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          title="Reset to step 0"
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-300 transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onStepBackward}
          disabled={currentStepIndex <= 0}
          title="Previous Step"
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${
            isPlaying
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/30'
              : stageMode === 'conv'
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/30'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Auto Play</span>
            </>
          )}
        </button>

        <button
          onClick={onStepForward}
          disabled={currentStepIndex >= totalSteps - 1}
          title="Next Step"
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Speed Slider & Progress Bar */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        {/* Speed Slider */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Gauge className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-slate-400">Speed:</span>
          <input
            type="range"
            min={100}
            max={1200}
            step={50}
            value={speedMs}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="w-20 accent-indigo-500 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-indigo-300 font-semibold w-12 text-right">
            {speedMs}ms
          </span>
        </div>

        {/* Mini Step Progress Bar */}
        <div className="hidden sm:flex flex-col gap-1 w-28">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                stageMode === 'conv' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-400 text-right font-mono">
            {progressPercent}% Complete
          </span>
        </div>
      </div>
    </div>
  );
};
