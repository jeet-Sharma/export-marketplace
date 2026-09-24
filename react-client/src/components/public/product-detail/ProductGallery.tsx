"use client";

import { useState } from "react";
import Panel from "@/components/ui/Panel";

export interface ProductGalleryProps {
  gallery?: string[];
  name: string;
}

// Product image/video gallery. Seed data uses emoji placeholders standing
// in for real product photography until real assets are wired up.
export default function ProductGallery({ gallery = [], name }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = gallery[activeIndex] ?? gallery[0];

  return (
    <Panel bodyClassName="p-4 flex flex-col gap-3">
      <div
        className="flex items-center justify-center h-[260px] bg-paper rounded text-[64px]"
        aria-hidden="true"
      >
        {active}
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2" role="tablist" aria-label={`${name} image thumbnails`}>
          {gallery.map((thumb, index) => (
            <button
              key={`${thumb}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`flex items-center justify-center w-[56px] h-[56px] rounded text-[24px] border cursor-pointer ${
                index === activeIndex
                  ? "border-saffron bg-saffron-soft"
                  : "border-line bg-paper"
              }`}
            >
              {thumb}
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}
