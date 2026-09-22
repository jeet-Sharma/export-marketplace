import NavIcon from './NavIcon';

/**
 * @param {object} props
 * @param {import('./NavIcon').NavIconName} props.icon
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {import('react').ReactNode} [props.action]
 * @returns {import('react').ReactElement}
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-sharp border border-line bg-paper text-textdim">
        <NavIcon name={icon} size={20} />
      </span>

      <h3 className="font-heading text-sm font-semibold text-text">{title}</h3>
      {description && <p className="max-w-sm text-xs text-textdim">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
