import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { PreprocessingPanel } from './components/PreprocessingPanel';
import { VisualStrip } from './components/VisualStrip';
import { KernelControls } from './components/KernelControls';
import { MatrixVisualizer } from './components/MatrixVisualizer';
import { PlaybackBar } from './components/PlaybackBar';
import { MathInspector } from './components/MathInspector';
import { DrawableCanvasModal } from './components/DrawableCanvasModal';

import type {
  PreprocessConfig,
  ConvolutionConfig,
  PoolingConfig,
  HoverState,
  Matrix2D,
} from './types/cnn';
import {
  runPreprocessingPipeline,
  computeOtsuThreshold,
} from './utils/preprocess';
import { convolve2D, pool2D } from './utils/cnnEngine';
import {
  KERNEL_PRESETS_3X3,
  generateStreetScene,
  generateCheckerboard,
  generateHandwrittenDigit8,
} from './utils/presets';

export function App() {
  // 1. Raw image state (128x128 ImageData)
  const [rawImgData, setRawImgData] = useState<ImageData | null>(null);
  const [activePreset, setActivePreset] = useState<string>('street');
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);

  // 2. Preprocessing Configuration
  const [preprocessConfig, setPreprocessConfig] = useState<PreprocessConfig>({
    colorMode: 'grayscale',
    threshold: 128,
    sharpenAlpha: 1.0,
    noiseReduction: 'none',
    normalize: false,
    targetSize: 16,
  });

  // 3. Convolution Configuration
  const [convConfig, setConvConfig] = useState<ConvolutionConfig>({
    kernelSize: 3,
    kernel: KERNEL_PRESETS_3X3[0].weights.map((r) => [...r]), // Default Sobel X
    padding: 1,
    stride: 1,
    bias: 0,
    activation: 'relu',
  });

  // 4. Pooling Configuration
  const [poolConfig, setPoolConfig] = useState<PoolingConfig>({
    mode: 'max',
    windowSize: 2,
    stride: 2,
  });

  // 5. Interactive & Playback State
  const [hoverState, setHoverState] = useState<HoverState>({ type: null });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speedMs, setSpeedMs] = useState(400);
  const [stageMode, setStageMode] = useState<'conv' | 'pool'>('conv');

  // Helper to load preset image into rawImgData
  const loadPreset = useCallback((preset: 'street' | 'checkerboard' | 'digit8') => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (preset === 'street') {
      generateStreetScene(ctx, 128);
    } else if (preset === 'checkerboard') {
      generateCheckerboard(ctx, 128);
    } else if (preset === 'digit8') {
      generateHandwrittenDigit8(ctx, 128);
    }

    const imgData = ctx.getImageData(0, 0, 128, 128);
    setRawImgData(imgData);
    setActivePreset(preset);

    // Calculate auto Otsu for the newly loaded image
    const optimalThreshold = computeOtsuThreshold(imgData);
    setPreprocessConfig((prev) => ({
      ...prev,
      threshold: optimalThreshold,
    }));
  }, []);

  // Initialize with 'street' preset on mount
  useEffect(() => {
    loadPreset('street');
  }, [loadPreset]);

  // Handle image file upload
  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#05070e';
        ctx.fillRect(0, 0, 128, 128);

        const scale = Math.min(128 / img.width, 128 / img.height);
        const nw = img.width * scale;
        const nh = img.height * scale;
        const ox = (128 - nw) / 2;
        const oy = (128 - nh) / 2;

        ctx.drawImage(img, ox, oy, nw, nh);
        const imgData = ctx.getImageData(0, 0, 128, 128);
        setRawImgData(imgData);
        setActivePreset('uploaded');

        const otsu = computeOtsuThreshold(imgData);
        setPreprocessConfig((prev) => ({
          ...prev,
          threshold: otsu,
        }));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle custom drawing canvas apply
  const handleApplyDrawnCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, 128, 128);
    setRawImgData(imgData);
    setActivePreset('custom_draw');

    const otsu = computeOtsuThreshold(imgData);
    setPreprocessConfig((prev) => ({
      ...prev,
      threshold: otsu,
    }));
  };

  // Run Auto Otsu manually
  const handleRunAutoOtsu = () => {
    if (!rawImgData) return;
    const otsu = computeOtsuThreshold(rawImgData);
    setPreprocessConfig((prev) => ({
      ...prev,
      threshold: otsu,
    }));
  };

  // 6. Preprocessing Pipeline Execution
  const { sharpenedImg, binarizedImg, inputMatrix } = useMemo(() => {
    if (!rawImgData) {
      const dummy: Matrix2D = Array.from(
        { length: preprocessConfig.targetSize },
        () => new Array(preprocessConfig.targetSize).fill(0)
      );
      return {
        sharpenedImg: null,
        binarizedImg: null,
        inputMatrix: dummy,
      };
    }
    return runPreprocessingPipeline(rawImgData, preprocessConfig);
  }, [rawImgData, preprocessConfig]);

  // 7. Convolution Execution
  const convResult = useMemo(() => {
    return convolve2D(inputMatrix, convConfig, preprocessConfig.normalize);
  }, [inputMatrix, convConfig, preprocessConfig.normalize]);

  // 8. Pooling Execution
  const poolResult = useMemo(() => {
    return pool2D(convResult.convMap, poolConfig, preprocessConfig.normalize);
  }, [convResult.convMap, poolConfig, preprocessConfig.normalize]);

  // Total steps for current animation stage
  const totalSteps =
    stageMode === 'conv' ? convResult.steps.length : poolResult.steps.length;

  // Keep step index within valid bounds
  useEffect(() => {
    if (currentStepIndex >= totalSteps && totalSteps > 0) {
      setCurrentStepIndex(totalSteps - 1);
    }
  }, [totalSteps, currentStepIndex]);

  // Step navigation handlers
  const handleStepForward = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev >= totalSteps - 1) {
        setIsPlaying(false);
        return 0;
      }
      return prev + 1;
    });
  }, [totalSteps]);

  const handleStepBackward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  // Determine active step details
  const activeConvStep =
    hoverState.type === 'conv' &&
    hoverState.r !== undefined &&
    hoverState.c !== undefined
      ? convResult.steps.find(
          (s) => s.outR === hoverState.r && s.outC === hoverState.c
        )
      : stageMode === 'conv' && convResult.steps.length > 0
      ? convResult.steps[currentStepIndex]
      : undefined;

  const activePoolStep =
    hoverState.type === 'pool' &&
    hoverState.r !== undefined &&
    hoverState.c !== undefined
      ? poolResult.steps.find(
          (s) => s.outR === hoverState.r && s.outC === hoverState.c
        )
      : stageMode === 'pool' && poolResult.steps.length > 0
      ? poolResult.steps[currentStepIndex]
      : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header Navigation */}
      <Header
        inputSize={preprocessConfig.targetSize}
        convSize={convResult.outSize}
        poolSize={poolResult.outSize}
        normalize={preprocessConfig.normalize}
        onToggleNormalize={() =>
          setPreprocessConfig((prev) => ({
            ...prev,
            normalize: !prev.normalize,
          }))
        }
      />

      {/* Main 3-Column Dashboard Container */}
      <main className="flex-1 p-4 md:p-6 max-w-[1680px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================== */}
        {/* LEFT COLUMN: Upload & Preprocessing Controls (Cols 1-4)       */}
        {/* ============================================================== */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          <PreprocessingPanel
            config={preprocessConfig}
            onChangeConfig={setPreprocessConfig}
            onSelectPreset={loadPreset}
            onOpenDrawModal={() => setIsDrawModalOpen(true)}
            onUploadImage={handleUploadImage}
            onRunAutoOtsu={handleRunAutoOtsu}
            activePreset={activePreset}
          />

          {/* Kernel & Hyperparameters Controls */}
          <KernelControls
            convConfig={convConfig}
            onChangeConvConfig={setConvConfig}
            poolConfig={poolConfig}
            onChangePoolConfig={setPoolConfig}
            normalize={preprocessConfig.normalize}
          />
        </section>

        {/* ============================================================== */}
        {/* RIGHT 2 COLUMNS: Visual Strip, Matrix Visualizer & Math (Cols 5-12) */}
        {/* ============================================================== */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* Center Top: 4 Synchronized Previews Strip */}
          <VisualStrip
            rawImg={rawImgData}
            sharpenedImg={sharpenedImg}
            binarizedImg={binarizedImg}
            inputMatrix={inputMatrix}
            config={preprocessConfig}
          />

          {/* Step-by-Step Playback Controller Bar */}
          <PlaybackBar
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            currentStepIndex={currentStepIndex}
            totalSteps={totalSteps}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onReset={handleReset}
            speedMs={speedMs}
            onChangeSpeed={setSpeedMs}
            stageMode={stageMode}
            onChangeStageMode={(m) => {
              setStageMode(m);
              setCurrentStepIndex(0);
            }}
          />

          {/* Interactive Numerical Matrix Grids with Bidirectional Hover */}
          <MatrixVisualizer
            paddedInput={convResult.paddedInput}
            padding={convConfig.padding}
            convMap={convResult.convMap}
            poolMap={poolResult.poolMap}
            convConfig={convConfig}
            poolConfig={poolConfig}
            hoverState={hoverState}
            onHover={setHoverState}
            normalize={preprocessConfig.normalize}
            activeConvStep={activeConvStep}
            activePoolStep={activePoolStep}
          />

          {/* Live Mathematical Equation & Calculation Drawer */}
          <MathInspector
            inputSize={preprocessConfig.targetSize}
            convConfig={convConfig}
            poolConfig={poolConfig}
            activeConvStep={activeConvStep}
            activePoolStep={activePoolStep}
            normalize={preprocessConfig.normalize}
            hoverType={hoverState.type}
          />
        </section>
      </main>

      {/* Interactive Drawable 16x16 / 128x128 Pixel Canvas Modal */}
      <DrawableCanvasModal
        isOpen={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        onApply={handleApplyDrawnCanvas}
      />
    </div>
  );
}

export default App;
