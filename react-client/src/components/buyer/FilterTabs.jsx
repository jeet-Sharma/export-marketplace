import cx from '@/lib/cx';

/**
 * @typedef {object} FilterTab
 * @property {string} id
 * @property {string} label
 */

/**
 * Single-select tab row, used for status filters.
 *
 * @param {object} props
 * @param {string} props.label Accessible group label.
 * @param {FilterTab[]} props.tabs
 * @param {string} props.activeId
 * @param {(id: string) => void} props.onChange
 * @param {Record<string, number>} [props.counts] Optional per-tab counts.
 * @returns {import('react').ReactElement}
 */
export default function FilterTabs({ label, tabs, activeId, onChange, counts }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      {tabs.map((tab) => {
        const active = tab.id === activeId;

        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.id)}
            className={cx(
              'rounded-sharp border px-2.5 py-1 text-xs transition-colors',
              active
                ? 'border-ink bg-ink text-paper'
                : 'border-line bg-panel text-textdim hover:text-text',
            )}
          >
            {tab.label}
            {counts && typeof counts[tab.id] === 'number' && (
              <span className="ml-1.5 font-heading tabular-nums">{counts[tab.id]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
