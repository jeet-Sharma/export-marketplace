/**
 * Two-thirds / one-third layout that stacks to a single column below `lg`.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.main
 * @param {import('react').ReactNode} props.side
 * @returns {import('react').ReactElement}
 */
export default function SplitSection({ main, side }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">{main}</div>
      <div className="space-y-4">{side}</div>
    </div>
  );
}
