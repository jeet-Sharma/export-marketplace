import Button from "@/components/ui/Button";
import { cellClassName } from "@/components/ui/Table";
import StatusPill from "@/components/vendor/StatusPill";
import type { Product } from "@/types/product";

export interface ProductRowProps {
  product: Product;
  onAction?: (product: Product) => void;
}

// One catalog row: product identity tile, commercial terms, workflow stage,
// status pill and the stage-appropriate action.
export default function ProductRow({ product, onAction }: ProductRowProps) {
  return (
    <tr>
      <td className={`px-4 py-3 ${cellClassName()}`}>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center bg-saffron-soft border border-line rounded text-[15px] w-[30px] h-[30px]"
            aria-hidden="true"
          >
            {product.emoji}
          </span>
          <span className="flex flex-col">
            <span className="font-heading font-semibold text-saffron text-[13px]">
              {product.name}
            </span>
            <span className="font-body text-text-dim text-[11px]">
              {product.origin} {"\u2192"} {product.market}
            </span>
          </span>
        </div>
      </td>
      <td
        className={`px-4 py-3 font-heading font-medium ${cellClassName()}`}
      >
        {product.price}
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>{product.moq}</td>
      <td className={`px-4 py-3 font-heading ${cellClassName()}`}>
        {product.hsCode}
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>{product.stage}</td>
      <td className={`px-4 py-3 ${cellClassName()}`}>
        <StatusPill status={product.status} />
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction?.(product)}
          disabled={!onAction}
        >
          {product.action}
        </Button>
      </td>
    </tr>
  );
}
