import { Eye } from "lucide-react";

import { ImageGallery } from "@/components/image-gallery";
import { StatusBadge } from "./status-badge";

/* ============================================================
   GALLERY CARD — responsive photo card with status overlay.
   Sits at the top of the main column on every breakpoint.
============================================================ */

export function GalleryCard({
  kind,
  itemId,
  itemTitle,
  itemStatus,
  images,
  isOwner,
  reportId,
}: {
  kind: "lost" | "found";
  itemId: string;
  itemTitle: string;
  itemStatus: string | null;
  images: { id: string; url: string }[];
  isOwner: boolean;
  /** Shown bottom-right as a subtle report identifier. */
  reportId?: string;
}) {
  return (
    <div
      className="
        relative
        h-64
        w-full
        overflow-hidden
        bg-slate-100
        sm:h-72
        max-lg:rounded-t-[28px]
        lg:h-full
      "
    >
      {/* Status — only when a distinct item status is provided
          (the header already carries the primary status pill). */}
      {itemStatus && (
        <div className="absolute left-4 top-4 z-20">
          <StatusBadge kind={kind} status={itemStatus} />
        </div>
      )}

      {images.length > 0 ? (
        <div className="absolute inset-0">
          <ImageGallery
            images={images}
            alt={itemTitle}
            addMoreItem={
              isOwner
                ? {
                    itemType: kind === "lost" ? "lost_item" : "found_item",
                    itemId,
                  }
                : undefined
            }
            fill
          />

          {/* Soft bottom scrim — grounds the overlay pills */}
          <div
            aria-hidden
            className="
              pointer-events-none
              absolute
              inset-x-0
              bottom-0
              z-10
              h-20
              bg-gradient-to-t
              from-black/35
              via-black/10
              to-transparent
            "
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-blue-50">
          <div className="text-center">
            <div
              className="
                mx-auto
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                border
                border-slate-200
                bg-white
                text-slate-400
                shadow-sm
              "
            >
              <Eye size={26} />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-600">
              No photos available
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Review the written details carefully.
            </p>
          </div>
        </div>
      )}

      {/* Photo count — bottom-left */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <span
          className="
            rounded-full
            border
            border-white/80
            bg-white/95
            px-3
            py-1.5
            text-[11px]
            font-semibold
            text-slate-600
            shadow-sm
            backdrop-blur
          "
        >
          {images.length} {images.length === 1 ? "photo" : "photos"}
        </span>
      </div>

      {/* Report ID — bottom-right, intentionally subtle */}
      {reportId && (
        <span
          className="
            absolute
            bottom-4
            right-4
            z-20
            rounded-full
            border
            border-white/60
            bg-black/35
            px-3
            py-1.5
            font-mono
            text-[10px]
            font-medium
            text-white/85
            backdrop-blur
          "
          title={`Report ID: ${reportId}`}
        >
          {reportId.slice(0, 8)}
        </span>
      )}
    </div>
  );
}
