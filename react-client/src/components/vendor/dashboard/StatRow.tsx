import StatCard from "@/components/vendor/dashboard/StatCard";
import type { StatCardData } from "@/types/stats";

export interface StatRowProps {
  stats?: StatCardData[];
}

// Responsive grid of stat cards: 2 cols on mobile, 4 cols from md up.
export default function StatRow({ stats = [] }: StatRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          label={stat.label}
          value={stat.value}
          format={stat.format}
          delta={stat.delta}
          deltaFormat={stat.deltaFormat}
          note={stat.note}
          trend={stat.trend}
        />
      ))}
    </div>
  );
}
