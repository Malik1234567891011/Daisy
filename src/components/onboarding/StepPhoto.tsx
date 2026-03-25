"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Check } from "lucide-react";
import Button from "@/components/ui/Button";

interface StepPhotoProps {
  onUploaded: () => void;
  onBack: () => void;
}

function compressImage(file: File, maxDim = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width <= maxDim && height <= maxDim && file.size < 2 * 1024 * 1024) {
        resolve(file);
        return;
      }

      if (width > height) {
        if (width > maxDim) { height = (height * maxDim) / width; width = maxDim; }
      } else {
        if (height > maxDim) { width = (width * maxDim) / height; height = maxDim; }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(
            new File([blob!], file.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        quality,
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function StepPhoto({ onUploaded, onBack }: StepPhotoProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG or PNG image");
      return;
    }

    setError("");
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const form = new FormData();
      form.append("photo", compressed);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
      setUploaded(false);
    } finally {
      setUploading(false);
    }
  }, []);

  return (
    <div className="pt-4 md:pt-8">
      <h2 className="font-display text-3xl text-charcoal mb-2 text-center">
        Add a photo
      </h2>
      <p className="text-text-secondary mb-10 text-center">
        So your match knows who they&rsquo;re meeting.
      </p>

      {/* Upload circle */}
      <div className="flex justify-center mb-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="group relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden border-2 border-dashed border-border hover:border-sage transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage-light/60 focus:ring-offset-4 focus:ring-offset-ivory disabled:opacity-60"
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Your photo"
                className="w-full h-full object-cover"
                style={{ animation: "photo-fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
              />
              {/* Overlay states */}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-charcoal/30">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {uploaded && !uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-charcoal/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs font-medium text-white bg-charcoal/60 rounded-full px-3 py-1.5">
                    Change photo
                  </span>
                </div>
              )}
              {uploaded && !uploading && (
                <div className="absolute bottom-2 right-2 w-7 h-7 bg-sage rounded-full flex items-center justify-center shadow-md"
                  style={{ animation: "photo-fade-in 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)" }}
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-text-tertiary group-hover:text-sage transition-colors duration-200">
              <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center group-hover:bg-sage-pale/50 transition-colors duration-200">
                <Camera className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium">Tap to upload</span>
            </div>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      <p className="text-xs text-text-tertiary text-center mb-8">
        Clear, front-facing photo works best
      </p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={onBack} disabled={uploading}>
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onUploaded}
          disabled={!uploaded || uploading}
          className="flex-1"
        >
          Continue
        </Button>
      </div>

      <style>{`
        @keyframes photo-fade-in {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes photo-fade-in {
            from { opacity: 1; transform: none; }
            to   { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </div>
  );
}
