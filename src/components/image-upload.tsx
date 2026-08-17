"use client";

import { useState, useRef, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

type SelectedImage = {
  file: File;
  preview: string;
};

export function ImageUpload({
  onChange,
  max = 4,
}: {
  onChange: (files: File[]) => void;
  max?: number;
}) {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setError(null);

    const newImages: SelectedImage[] = [...images];

    for (const file of Array.from(files)) {
      if (newImages.length >= max) {
        setError(`You can upload up to ${max} photos.`);
        break;
      }
      if (!VALID_TYPES.includes(file.type)) {
        setError("Only image files (JPEG, PNG, WebP, GIF) are allowed.");
        continue;
      }
      if (file.size > MAX_SIZE) {
        setError("Each image must be smaller than 5 MB.");
        continue;
      }
      newImages.push({ file, preview: URL.createObjectURL(file) });
    }

    setImages(newImages);
    onChange(newImages.map((img) => img.file));

    // Reset the input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      const next = prev.filter((_, i) => i !== index);
      onChange(next.map((img) => img.file));
      return next;
    });
  }

  return (
    <div>
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-navy-900/50 p-6 text-center transition-colors hover:border-electric-500/40"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <ImagePlus size={28} className="mb-2 text-slate-500" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-electric-400 hover:underline"
        >
          Click to upload photos
        </button>
        <p className="mt-1 text-xs text-slate-500">or drag &amp; drop</p>
        <input
          ref={inputRef}
          type="file"
          name="images"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Photos help others recognize the item. Avoid uploading sensitive documents or personal
        information.
      </p>

      {error && <p className="field-error">{error}</p>}

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.preview}
                alt={`Upload preview ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label={`Remove image ${i + 1}`}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
