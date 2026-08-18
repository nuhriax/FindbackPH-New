"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ImageGallery({
  images,
  alt,
}: {
  images: { url: string; alt?: string }[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-slate-200/70 bg-ice-50 text-sm text-slate-500">
        No photos were uploaded for this report.
      </div>
    );
  }

  const current = images[active];

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-ice-50">
        <Image
          src={current.url}
          alt={current.alt || alt}
          fill
          sizes="(max-width: 768px) 100vw, 66vw"
          className="object-cover"
          unoptimized
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border transition-all",
                i === active
                  ? "border-electric-500/70 ring-1 ring-electric-500/50"
                  : "border-slate-200 opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
