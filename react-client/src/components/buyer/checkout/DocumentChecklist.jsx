import Badge from '@/components/ui/Badge';
import Panel from '@/components/ui/Panel';
import NavIcon from '@/components/buyer/NavIcon';
import { checkoutCopy, documentChecklist } from '@/data/cart';

/**
 * Export documents the supplier issues after payment clears.
 * @returns {import('react').ReactElement}
 */
export default function DocumentChecklist() {
  return (
    <Panel
      title={checkoutCopy.documentsTitle}
      description={checkoutCopy.documentsDescription}
      padded={false}
    >
      <ul className="divide-y divide-line">
        {documentChecklist.map((document) => (
          <li
            key={document.id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-bluegrey">
                <NavIcon name="document" size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-text">{document.name}</p>
                <p className="mt-0.5 text-xs text-textdim">{document.description}</p>
              </div>
            </div>

            <Badge accent="saffron" className="sm:shrink-0">
              {document.status}
            </Badge>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
