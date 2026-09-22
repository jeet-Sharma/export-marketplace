import Badge from '@/components/ui/Badge';
import NavIcon from './NavIcon';

/**
 * Marks a supplier or company whose KYC has been verified.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @returns {import('react').ReactElement}
 */
export default function VerifiedBadge({ label = 'Verified' }) {
  return (
    <Badge accent="teal" icon={<NavIcon name="check" size={11} />}>
      {label}
    </Badge>
  );
}
