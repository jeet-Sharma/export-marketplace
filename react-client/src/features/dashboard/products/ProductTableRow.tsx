import Image from "next/image";
import Link from "next/link";
import { PRODUCT_COLUMNS } from "./productColumns";
import type { ProductRow } from "./productData";
import { PublicationBadge, VerificationBadge } from "./StatusBadges";

import {
  usePublishAdminProductMutation,
  useUnpublishAdminProductMutation,
} from "./productsApi";

type ProductTableRowProps = {
  product: ProductRow;
  /** Destination for the View/Edit actions (built by the parent so the
      active ?role= param is preserved). */
  detailHref: string;
  highlighted?: boolean;
};

export function ProductTableRow({
  product,
  detailHref,
  highlighted = false,
}: ProductTableRowProps) {
  const [publish, { isLoading: isPublishing }] = usePublishAdminProductMutation();
  const [unpublish, { isLoading: isUnpublishing }] =
    useUnpublishAdminProductMutation();

  const isBusy = isPublishing || isUnpublishing;
  const isPublished = product.rawStatus === "PUBLISHED";

  const handleTogglePublish = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (isPublished) {
        await unpublish(product.id).unwrap();
      } else {
        await publish(product.id).unwrap();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

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
      <div className={`flex items-center gap-1.5 ${PRODUCT_COLUMNS.actions}`}>
        <Link
          href={detailHref}
          className="flex h-[30px] flex-1 items-center justify-center rounded-[6px] border border-bloom-pink bg-white text-[11px] font-bold text-bloom-pink transition-colors hover:bg-bloom-pink hover:text-white"
        >
          View
        </Link>
        <button
          type="button"
          onClick={handleTogglePublish}
          disabled={isBusy}
          title={isPublished ? "Unpublish listing" : "Publish listing"}
          className={`flex h-[30px] flex-1 items-center justify-center rounded-[6px] text-[11px] font-semibold transition-colors disabled:opacity-50 ${
            isPublished
              ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
              : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          }`}
        >
          {isBusy ? "…" : isPublished ? "Unpublish" : "Publish"}
        </button>
      </div>
    </div>
  );
}
