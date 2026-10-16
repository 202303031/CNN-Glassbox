import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Trash2, ArrowRight, X, RotateCcw } from 'lucide-react';

interface DrawableCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (canvas: HTMLCanvasElement) => void;
}

export const DrawableCanvasModal: React.FC<DrawableCanvasModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState(12);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Initialize with black background
        ctx.fillStyle = '#05070e';
        ctx.fillRect(0, 0, 128, 128);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.strokeStyle = '#ffffff';
    } else {
      ctx.strokeStyle = '#05070e';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, 128, 128);
    ctx.beginPath();
  };

  const handleInvert = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, 128, 128);
    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i] = 255 - imgData.data[i];
      imgData.data[i + 1] = 255 - imgData.data[i + 1];
      imgData.data[i + 2] = 255 - imgData.data[i + 2];
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const handleConfirm = () => {
    if (canvasRef.current) {
      onApply(canvasRef.current);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-lg text-white">Custom Drawable Canvas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Draw any digit, boundary shape, or custom filter pattern. The drawing is converted to an uncompressed 128x128 canvas and passed directly into the preprocessing pipeline.
        </p>

        {/* Drawing Canvas Area */}
        <div className="flex justify-center p-3 bg-slate-950 rounded-xl border border-slate-800/80 shadow-inner">
          <canvas
            ref={canvasRef}
            width={128}
            height={128}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={draw}
            onMouseLeave={handleMouseUp}
            className="w-64 h-64 border-2 border-dashed border-indigo-500/40 rounded-lg cursor-crosshair touch-none bg-[#05070e]"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                tool === 'pen'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Pencil className="w-4 h-4" />
              Pen
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                tool === 'eraser'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Eraser className="w-4 h-4" />
              Eraser
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Brush:</span>
            <input
              type="range"
              min={4}
              max={24}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-16 accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleInvert}
              title="Invert Colors"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              title="Clear Canvas"
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
          >
            Feed to CNN
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
