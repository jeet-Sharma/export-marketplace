import Badge from '@/components/ui/Badge';
import LetterTile from '@/components/buyer/LetterTile';
import NavIcon from '@/components/buyer/NavIcon';
import { statusLabel } from '@/lib/statusColor';

/**
 * Company avatar, name, KYC pill and buyer rating.
 * @param {object} props
 * @param {import('@/data/profile').buyerProfile} props.profile
 * @returns {import('react').ReactElement}
 */
export default function IdentityStrip({ profile }) {
  return (
    <div className="flex flex-col gap-3 rounded-sharp border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <LetterTile label={profile.companyName} initials={profile.initials} size="lg" accent="blueGrey" />
        <div>
          <p className="font-heading text-base font-semibold text-ink">{profile.companyName}</p>
          <p className="text-xs text-textdim">{profile.contactName} · {profile.country}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge accent="teal" icon={<NavIcon name="check" size={11} />}>
          KYC {statusLabel(profile.kycStatus)}
        </Badge>
        <Badge accent="saffron" icon={<NavIcon name="star" size={11} filled />}>
          {profile.rating.toFixed(1)} · {profile.reviewCount} reviews
        </Badge>
      </div>
    </div>
  );
}
