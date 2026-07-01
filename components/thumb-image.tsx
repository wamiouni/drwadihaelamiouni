"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";

/** Thumbnail with graceful degradation: direct → hotlink proxy → monogram. */
export function ThumbImage({
  url,
  className = "",
}: {
  url: string | null;
  className?: string;
}) {
  const { lang } = useLanguage();
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const src =
    !url || stage === 2
      ? null
      : stage === 0
        ? url
        : `/api/thumb?u=${encodeURIComponent(url)}`;

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center font-display text-5xl text-mauve/40">
        {lang === "ar" ? "و" : "W"}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setStage((s) => (s + 1) as 0 | 1 | 2)}
      className={className}
    />
  );
}
