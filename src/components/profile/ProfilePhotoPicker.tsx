"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Check } from "lucide-react";
import { compressImage } from "@/lib/compressImage";
import { cn } from "@/lib/utils";

type ProfilePhotoPickerProps = {
  photoUrl: string | null;
  onUploaded: (url: string) => void;
  disabled?: boolean;
  /** Larger circle for profile page; compact for dashboard */
  variant?: "default" | "compact";
};

export default function ProfilePhotoPicker({
  photoUrl,
  onUploaded,
  disabled,
  variant = "default",
}: ProfilePhotoPickerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!preview) return;
    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Please use JPG, PNG, or WebP");
        return;
      }

      setError("");
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploading(true);
      setJustSaved(false);

      try {
        const compressed = await compressImage(file);
        const form = new FormData();
        form.append("photo", compressed);

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Upload failed");

        setPreview(null);
        onUploaded(data.url as string);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [onUploaded],
  );

  const displaySrc = preview || photoUrl;
  const isCompact = variant === "compact";
  const circleClass = isCompact
    ? "w-24 h-24 sm:w-28 sm:h-28"
    : "w-36 h-36 sm:w-44 sm:h-44";

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-charcoal">Profile photo</p>
      <p className="mb-4 text-sm text-text-tertiary">
        {photoUrl
          ? "Tap your photo to replace it. Shown to matches."
          : "Add a clear, front-facing photo so your match knows who you are."}
      </p>

      <div className="flex justify-center sm:justify-start">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className={cn(
            "group relative rounded-full overflow-hidden border-2 border-dashed border-border",
            "hover:border-sage transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-sage-light/60 focus:ring-offset-4 focus:ring-offset-ivory",
            "disabled:opacity-60 disabled:pointer-events-none",
            circleClass,
          )}
        >
          {displaySrc ? (
            <>
              <img
                src={displaySrc}
                alt=""
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-charcoal/35">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-charcoal/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs font-medium text-white bg-charcoal/65 rounded-full px-3 py-1.5">
                    Change photo
                  </span>
                </div>
              )}
              {justSaved && !uploading && (
                <div
                  className="absolute bottom-1.5 right-1.5 w-7 h-7 bg-sage rounded-full flex items-center justify-center shadow-md"
                  aria-hidden
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-text-tertiary group-hover:text-sage transition-colors">
              <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center group-hover:bg-sage-pale/50">
                <Camera className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-medium px-2 text-center">Add photo</span>
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

      <p className="mt-3 text-xs text-text-tertiary">JPG, PNG, or WebP · max 3 MB</p>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
