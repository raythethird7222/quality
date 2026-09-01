"use client";

// Modal that lets the user crop an uploaded image into a square avatar.
import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Check, Crop, Loader2, X } from "lucide-react";

type AvatarCropModalProps = {
  open: boolean;
  imageSrc: string;
  saving?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (croppedDataUrl: string) => void;
};

// Target square dimensions (px) for the exported avatar image.
const OUTPUT_SIZE = 400;

// Loads an image element from a source URL, resolving once it is ready.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = src;
  });
}

// Crops the selected area and returns a resized JPEG data URL.
async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

// Avatar crop modal: interactive cropper with zoom and save/cancel actions.
export default function AvatarCropModal({
  open,
  imageSrc,
  saving = false,
  error = null,
  onCancel,
  onSave,
}: AvatarCropModalProps) {
  // Crop position, zoom level, and the latest computed cropped pixel area.
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Captures the cropped pixel rectangle whenever the user adjusts the crop.
  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  // Render nothing when the modal is closed.
  if (!open) return null;

  // Persists the cropped image by generating a data URL and calling onSave.
  async function handleSave() {
    if (!croppedAreaPixels) return;
    try {
      const dataUrl = await getCroppedImage(imageSrc, croppedAreaPixels);
      onSave(dataUrl);
    } catch {
      onCancel();
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative mx-4 w-full max-w-[560px] rounded-2xl border border-border-default bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2 className="flex items-center gap-2.5 text-[16px] font-bold text-text-primary">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gold/10">
              <Crop size={18} className="text-brand-gold" />
            </span>
            Crop Profile Photo
          </h2>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-muted transition hover:bg-surface-overlay hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cropper Body */}
        <div className="px-6 py-5">
          <div className="relative h-[360px] w-full overflow-hidden rounded-xl border border-border-default bg-surface-base">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-[12px] font-semibold text-text-secondary">
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-default"
            />
          </div>
          <p className="mt-3 text-center text-[12px] text-text-muted">
            Drag to reposition. The photo will be saved as a 1:1 square (2x2).
          </p>
          {error && (
            <p className="mt-3 rounded-lg border border-brand-crimson/30 bg-brand-crimson/10 px-3 py-2 text-center text-[12px] font-medium text-brand-crimson">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-6 py-4">
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-border-default bg-card px-4 py-2 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {/* Show a spinner while saving, otherwise the save action */}
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={14} />
                Save Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}