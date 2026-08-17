import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, ImageOff } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/validation";
import type { ItemCategory } from "@/types/database";

export function ItemCard({
  href,
  title,
  category,
  city,
  province,
  date,
  description,
  kind,
  imageUrl,
}: {
  href: string;
  title: string;
  category: ItemCategory;
  city: string;
  province: string;
  date: string;
  description: string;
  kind: "lost" | "found";
  imageUrl?: string | null;
}) {
  return (
    <Link
      href={href}
      className="card group block overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-electric-500/50"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-navy-900">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-slate-600">
            <ImageOff size={28} />
            <span className="text-xs">No photo</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              kind === "lost" ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300"
            }`}
          >
            {kind === "lost" ? "Lost" : "Found"}
          </span>
          <span className="text-xs text-slate-500">{CATEGORY_LABELS[category]}</span>
        </div>
        <h3 className="mt-2 truncate font-medium group-hover:text-electric-300">{title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><MapPin size={12} /> {city}, {province}</span>
          <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
        </div>
      </div>
    </Link>
  );
}
