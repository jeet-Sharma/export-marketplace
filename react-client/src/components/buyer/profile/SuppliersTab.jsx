import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import LetterTile from '@/components/buyer/LetterTile';
import NavIcon from '@/components/buyer/NavIcon';
import VerifiedBadge from '@/components/buyer/VerifiedBadge';
import { actionLabels } from '@/data/seedData';
import { supplierMatchingPromo } from '@/data/profile';
import formatDate from '@/lib/formatDate';

/**
 * Contacted suppliers plus the AI supplier matching promo.
 * @param {object} props
 * @param {import('@/data/suppliers').Supplier[]} props.suppliers
 * @returns {import('react').ReactElement}
 */
export default function SuppliersTab({ suppliers }) {
  return (
    <>
      <Panel
        title="AI Supplier Matching"
        action={<Badge accent="saffron">{supplierMatchingPromo.badgeLabel}</Badge>}
        className="border-saffron bg-saffron-soft"
        footer={
          <Button variant="accent" size="md">
            {supplierMatchingPromo.actionLabel}
          </Button>
        }
      >
        <p className="flex items-start gap-2 text-sm text-text">
          <NavIcon name="spark" size={16} className="mt-0.5 text-saffron" />
          {supplierMatchingPromo.description}
        </p>
      </Panel>

      <Panel title="Contacted Suppliers" padded={false}>
        <ul className="divide-y divide-line">
          {suppliers.map((supplier) => (
            <li key={supplier.id} className="flex items-center gap-3 px-4 py-3">
              <LetterTile label={supplier.name} initials={supplier.initials} />

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-text">
                  {supplier.name}
                  {supplier.verified && <VerifiedBadge />}
                </p>
                <p className="mt-0.5 text-xs text-textdim">
                  {supplier.location} · Contacted {formatDate(supplier.contactedOn)}
                </p>
              </div>

              <Button variant="ghost">{actionLabels.contactSupplier}</Button>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
