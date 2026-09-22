import LetterTile from './LetterTile';
import VerifiedBadge from './VerifiedBadge';

/**
 * Product cell: initial tile, product name and a dim line that carries the
 * supplier's verified badge. Shared by the catalogue, cart, wishlist and order
 * tables.
 *
 * @param {object} props
 * @param {string} props.name
 * @param {import('@/data/suppliers').Supplier | null} [props.supplier]
 * @param {string} [props.note] Appended to the dim line.
 * @param {boolean} [props.showSupplierName] Off when a separate supplier column exists.
 * @param {boolean} [props.showTile] Off when the card already shows an image tile.
 * @param {'sm' | 'md' | 'lg'} [props.size]
 * @returns {import('react').ReactElement}
 */
export default function ProductIdentity({
  name,
  supplier,
  note,
  showSupplierName = true,
  showTile = true,
  size = 'md',
}) {
  const subtextParts = [showSupplierName ? supplier?.name : null, note].filter(Boolean);

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {showTile && <LetterTile label={name} size={size} />}

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text">{name}</p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-textdim">
          {subtextParts.length > 0 && <span className="truncate">{subtextParts.join(' · ')}</span>}
          {supplier?.verified && <VerifiedBadge />}
        </p>
      </div>
    </div>
  );
}
