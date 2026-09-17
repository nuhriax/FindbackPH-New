"use client";

import { useState } from "react";
import { Expand } from "lucide-react";

import { AvatarImage } from "@/components/avatar-image";
import { PhotoViewerModal } from "@/components/photo-viewer-modal";

/**
 * MemberAvatar — Facebook-style tappable profile photo.
 *
 * The avatar renders as a button: click / tap opens the true fullscreen
 * PhotoViewerModal (portal to <body>, black backdrop, Esc / click-outside
 * to close, keyboard + swipe support) so visitors can inspect the full
 * uncropped photo and confirm the member is a real person.
 *
 * When there is no avatar (initials tile), it renders static — nothing to
 * expand.
 */
export function MemberAvatar({
  src,
  alt,
  initials,
}: {
  src: string | null;
  alt: string;
  initials: string;
}) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-electric-500 to-electric-600 font-display text-3xl font-bold text-white sm:text-4xl">
        {initials}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View ${alt} in full size`}
        title="View photo"
        className="group relative block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
      >
        <AvatarImage
          src={src}
          alt={alt}
          initials={initials}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        {/* Hover / focus hint — "clickable" affordance */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-navy-950/0 opacity-0 transition-all duration-200 group-hover:bg-navy-950/25 group-hover:opacity-100 group-focus-visible:bg-navy-950/25 group-focus-visible:opacity-100"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-sm">
            <Expand size={18} />
          </span>
        </span>
      </button>

      {open && (
        <PhotoViewerModal
          images={[{ url: src, alt }]}
          alt={alt}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
