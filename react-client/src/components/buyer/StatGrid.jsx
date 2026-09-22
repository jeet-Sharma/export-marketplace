import StatCard from './StatCard';

/**
 * @typedef {object} Stat
 * @property {string} id
 * @property {string} label
 * @property {string} value
 * @property {string} [deltaLabel]
 * @property {'up' | 'down' | 'neutral'} [deltaDirection]
 * @property {import('@/theme/colors').AccentToken} [valueAccent]
 */

/**
 * Two columns on mobile, four from `lg`.
 *
 * @param {object} props
 * @param {Stat[]} props.stats
 * @returns {import('react').ReactElement}
 */
export default function StatGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          label={stat.label}
          value={stat.value}
          deltaLabel={stat.deltaLabel}
          deltaDirection={stat.deltaDirection}
          valueAccent={stat.valueAccent}
        />
      ))}
    </div>
  );
}
