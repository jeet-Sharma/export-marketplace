import Image from "next/image";
import { PRODUCT_COLUMNS } from "./productColumns";
import type { ProductRow } from "./productData";
import { PublicationBadge, VerificationBadge } from "./StatusBadges";

type ProductTableRowProps = {
  product: ProductRow;
  highlighted?: boolean;
};

export function ProductTableRow({
  product,
  highlighted = false,
}: ProductTableRowProps) {
  return (
    <div
      className={
        highlighted
          ? "flex w-full items-center gap-3 border-b border-[#e9c6d3] border-l-[3px] border-l-bloom-pink bg-[#fffcf9] p-4"
          : "flex w-full items-center gap-3 border-b border-[#eee9e4] bg-white px-4 py-3"
      }
    >
      {/* Product identity */}
      <div className={`flex items-center gap-3 ${PRODUCT_COLUMNS.product}`}>
        <Image
          src={product.image}
          alt={product.name}
          width={54}
          height={54}
          className="size-[54px] shrink-0 rounded-[10px] object-cover"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-[13px] font-semibold leading-[1.3] text-bloom-ink">
            {product.name}
          </p>
          <p className="text-[10px] text-bloom-muted">{product.category}</p>
          <p className="text-[10px] font-bold text-bloom-pink">
            {product.origin}
          </p>
        </div>
      </div>

      {/* Trade setup */}
      <div className={`flex flex-col gap-1 ${PRODUCT_COLUMNS.trade}`}>
        {product.tradeSetup.map((line, i) => (
          <p
            key={line}
            className={
              i === 0
                ? "text-[12px] font-semibold leading-[1.35] text-bloom-ink"
                : "text-[11px] leading-[1.35] text-bloom-muted"
            }
          >
            {line}
          </p>
        ))}
      </div>

      {/* Price */}
      <div className={PRODUCT_COLUMNS.price}>
        <p className="text-[13px] font-bold text-bloom-ink">{product.price}</p>
      </div>

      {/* Supplier */}
      <div className={`flex flex-col items-start gap-1.5 ${PRODUCT_COLUMNS.supplier}`}>
        <p className="text-[12px] font-semibold leading-[1.35] text-bloom-ink">
          {product.supplier}
        </p>
        <VerificationBadge status={product.verification} />
      </div>

      {/* Publication status */}
      <div className={`flex flex-col items-start gap-1.5 ${PRODUCT_COLUMNS.status}`}>
        <PublicationBadge status={product.publication} />
        <p
          className={
            product.publication === "published"
              ? "text-[10px] leading-[1.35] text-bloom-green"
              : "text-[10px] leading-[1.35] text-bloom-muted"
          }
        >
          {product.exportEligibility}
        </p>
        {product.note ? (
          <p className="text-[10px] text-bloom-muted">{product.note}</p>
        ) : null}
      </div>

      {/* Row actions */}
      <div className={`flex gap-1.5 ${PRODUCT_COLUMNS.actions}`}>
        <button
          type="button"
          className={
            highlighted
              ? "flex h-[30px] flex-1 items-center justify-center rounded-[6px] border border-bloom-pink bg-bloom-pink text-[11px] font-bold text-white"
              : "flex h-[30px] flex-1 items-center justify-center rounded-[6px] border border-bloom-pink bg-white text-[11px] font-bold text-bloom-pink"
          }
        >
          View
        </button>
        <button
          type="button"
          className="flex h-[30px] flex-1 items-center justify-center rounded-[6px] border border-bloom-border bg-white text-[11px] font-semibold text-bloom-ink"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
