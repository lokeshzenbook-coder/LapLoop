"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export default function LaptopImage({
  src,
  alt,
  fill = true,
  className,
  priority,
  sizes,
}: {
  src?: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
          className
        )}
      >
        <span className="text-3xl">💻</span>
        <span className="text-xs font-medium text-zinc-400">No photo yet</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={cn("object-contain", className)}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}