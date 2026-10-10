import React, { useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { 
  X, 
  Check, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Crop, 
  Loader as Loader2,
  RefreshCw
} from "lucide-react";
import { getCroppedImg } from "../../utils/cropImage";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => Promise<void> | void;
  cropShape?: "round" | "rect";
  aspect?: number;
  title?: string;
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  cropShape = "round",
  aspect = 1,
  title = "Crop Profile Picture",
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (newCrop: Point) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleApply = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        { horizontal: false, vertical: false },
        "profile_picture.jpg"
      );
      await onCropComplete(croppedFile);
      onClose();
    } catch (e) {
      console.error("Failed to crop image:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--card)] w-full max-w-xl rounded-2xl border border-[var(--line)] shadow-modal flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center">
              <Crop size={18} />
            </div>
            <div>
              <h3 className="text-base font-hero font-bold tracking-tight text-[var(--ink)]">
                {title}
              </h3>
              <p className="text-xs text-[var(--ink-soft)] font-sans">
                Drag, zoom, and adjust the photo frame before saving.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cropper Canvas Container */}
        <div className="relative w-full h-80 sm:h-96 bg-neutral-950 overflow-hidden select-none">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={onZoomChange}
            classes={{
              containerClassName: "w-full h-full",
              cropAreaClassName: cropShape === "round" ? "!rounded-full border-2 !border-[var(--blue)]" : "!rounded-lg border-2 !border-[var(--blue)]",
            }}
          />
        </div>

        {/* Controls Toolbar */}
        <div className="p-5 sm:p-6 space-y-4 bg-[var(--card)] border-t border-[var(--line)]">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] p-1 transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-[var(--line)] rounded-lg appearance-none cursor-pointer accent-[var(--blue)]"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)] p-1 transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3.5 py-1.5 rounded-full border border-[var(--line)] hover:bg-[var(--line)]/50 text-[var(--ink)] text-xs font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Rotate 90° clockwise"
              >
                <RotateCw size={14} />
                <span>Rotate</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-full border border-[var(--line)] hover:bg-[var(--line)]/50 text-[var(--ink-soft)] hover:text-[var(--ink)] text-xs font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset zoom and rotation"
              >
                <RefreshCw size={14} />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-5 py-2 rounded-full border border-[var(--line)] hover:bg-[var(--line)]/50 text-[var(--ink-soft)] hover:text-[var(--ink)] text-xs font-sans font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={isProcessing}
                className="px-5 py-2 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs font-sans font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Crop & Upload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
