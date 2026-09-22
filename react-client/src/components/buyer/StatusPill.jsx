import Badge from '@/components/ui/Badge';
import statusColor, { statusLabel } from '@/lib/statusColor';

/**
 * Status badge whose colour comes from the shared status → accent mapping.
 *
 * @param {object} props
 * @param {string} props.status
 * @param {string} [props.label] Overrides the derived label.
 * @param {'soft' | 'outline' | 'solid'} [props.variant]
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function StatusPill({ status, label, variant = 'soft', className }) {
  return (
    <Badge accent={statusColor(status)} variant={variant} className={className}>
      {label ?? statusLabel(status)}
    </Badge>
  );
}
