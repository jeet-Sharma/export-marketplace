import cx from '@/lib/cx';
import { profileTabs } from '@/data/profile';

/**
 * @param {object} props
 * @param {string} props.activeId
 * @param {(id: string) => void} props.onChange
 * @returns {import('react').ReactElement}
 */
export default function ProfileTabs({ activeId, onChange }) {
  return (
    <div role="tablist" aria-label="Profile sections" className="flex flex-wrap gap-1 border-b border-line pb-2">
      {profileTabs.map((tab) => {
        const active = tab.id === activeId;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cx(
              'rounded-sharp border px-3 py-1.5 text-sm transition-colors',
              active
                ? 'border-ink bg-ink text-paper'
                : 'border-line bg-panel text-textdim hover:text-text',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
