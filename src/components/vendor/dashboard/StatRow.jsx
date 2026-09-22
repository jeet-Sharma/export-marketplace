import StatCard from "@/components/vendor/dashboard/StatCard";

// Responsive grid of stat cards: 2 cols on mobile, 4 cols from md up.
export default function StatRow({ stats = [] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          label={stat.label}
          value={stat.value}
          delta={stat.delta}
          trend={stat.trend}
        />
      ))}
    </div>
  );
}
