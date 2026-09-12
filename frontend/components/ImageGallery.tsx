"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { LaptopImage } from "@/types";

export default function ImageGallery({ images, title }: { images: LaptopImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const urls = images.map((i) => i.url).filter(Boolean);

  if (urls.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-4xl">💻</span>
        <span className="text-sm text-zinc-400">No photos uploaded yet</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <Image
          src={urls[Math.min(active, urls.length - 1)]}
          alt={`${title} photo ${active + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-3"
          draggable={false}
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {active + 1} / {urls.length}
        </span>
      </div>
      {urls.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition",
                i === active
                  ? "border-brand-500 ring-2 ring-brand-500/30"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
              aria-label={`View photo ${i + 1}`}
            >
              <Image src={url} alt="" fill sizes="112px" className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}