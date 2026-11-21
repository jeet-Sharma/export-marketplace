import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Base shimmer block — reuse for any loading placeholder. */
export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`skeleton-shimmer ${className}`.trim()}
      {...props}
    />
  );
}

type CountProps = {
  count?: number;
  className?: string;
};

/** Product card grid skeleton (marketplace listing / trending). */
export function ProductCardSkeletonGrid({
  count = 12,
  className = "",
}: CountProps) {
  return (
    <div
      className={`grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 ${className}`.trim()}
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-[278px] rounded-[10px] border border-black/[0.09]"
        />
      ))}
    </div>
  );
}

/** Horizontal chip row skeleton (e.g. shop-by-category). */
export function ChipSkeletonRow({ count = 6, className = "" }: CountProps) {
  return (
    <div
      className={`flex flex-wrap gap-[10px] ${className}`.trim()}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-[46px] min-w-[140px] flex-1 rounded-[10px] border border-black/[0.09]"
        />
      ))}
    </div>
  );
}

/** Admin product table body skeleton rows. */
export function ProductTableRowsSkeleton({
  count = 6,
  className = "",
}: CountProps) {
  return (
    <div
      className={className}
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex w-full items-center gap-3 border-b border-[#eee9e4] px-4 py-3"
        >
          <div className="flex w-[260px] shrink-0 items-center gap-3">
            <Skeleton className="size-[54px] shrink-0 rounded-[10px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-[70%] rounded-[6px]" />
              <Skeleton className="h-2.5 w-[45%] rounded-[6px]" />
              <Skeleton className="h-2.5 w-[30%] rounded-[6px]" />
            </div>
          </div>
          <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-[80%] rounded-[6px]" />
            <Skeleton className="h-2.5 w-[55%] rounded-[6px]" />
          </div>
          <div className="min-w-[120px] flex-[0_0_15%]">
            <Skeleton className="h-3.5 w-[70%] rounded-[6px]" />
          </div>
          <div className="flex min-w-[150px] flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-[65%] rounded-[6px]" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex min-w-[130px] flex-1 flex-col gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-2.5 w-[50%] rounded-[6px]" />
          </div>
          <div className="flex w-[240px] shrink-0 items-center gap-1.5">
            <Skeleton className="h-[30px] flex-1 rounded-[6px]" />
            <Skeleton className="h-[30px] flex-1 rounded-[6px]" />
            <Skeleton className="h-[30px] flex-1 rounded-[6px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Form-shaped skeleton for the shared add/edit product modal. */
export function ProductFormSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6 ${className}`.trim()}
      role="status"
      aria-label="Loading product details"
    >
      {[0, 1, 2].map((section) => (
        <section
          key={section}
          className="flex w-full flex-col gap-4 rounded-[14px] border border-[#eee9e4] bg-bloom-card p-4"
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40 rounded-[6px]" />
            <Skeleton className="h-3 w-72 max-w-full rounded-[6px]" />
          </div>
          <div className="flex w-full gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-2.5 w-24 rounded-[6px]" />
              <Skeleton className="h-10 w-full rounded-[10px]" />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-2.5 w-20 rounded-[6px]" />
              <Skeleton className="h-10 w-full rounded-[10px]" />
            </div>
          </div>
          {section === 0 ? (
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-2.5 w-28 rounded-[6px]" />
              <Skeleton className="h-[72px] w-full rounded-[10px]" />
            </div>
          ) : null}
          <div className="flex w-full gap-3">
            <Skeleton className="h-10 flex-1 rounded-[10px]" />
            <Skeleton className="h-10 flex-1 rounded-[10px]" />
          </div>
        </section>
      ))}
    </div>
  );
}

/** Footer placeholder matching Add/Edit product modal actions. */
export function ProductModalFooterSkeleton() {
  return (
    <div className="flex items-center justify-between border-t border-[#eee9e4] px-6 py-4">
      <Skeleton className="h-3 w-48 rounded-[6px]" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-20 rounded-[10px]" />
        <Skeleton className="h-10 w-28 rounded-[10px]" />
        <Skeleton className="h-10 w-32 rounded-[10px]" />
      </div>
    </div>
  );
}
