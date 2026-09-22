import Input from '@/components/ui/Input';
import cx from '@/lib/cx';

/**
 * Search and filter bar that sits above a table or grid.
 *
 * @param {object} props
 * @param {string} props.searchId
 * @param {string} props.searchLabel Accessible label for the search field.
 * @param {string} props.searchValue
 * @param {(value: string) => void} props.onSearchChange
 * @param {string} [props.searchPlaceholder]
 * @param {import('react').ReactNode} [props.filters] Select controls.
 * @param {import('react').ReactNode} [props.tabs] Status tabs, rendered below.
 * @param {string} [props.summary] Result count or similar hint.
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function TableToolbar({
  searchId,
  searchLabel,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  tabs,
  summary,
  className,
}) {
  return (
    <div className={cx('space-y-3 border-b border-line p-3', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <Input
          id={searchId}
          label={searchLabel}
          labelHidden
          type="search"
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="w-full sm:max-w-xs"
        />

        {filters && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end sm:justify-end">
            {filters}
          </div>
        )}
      </div>

      {(tabs || summary) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {tabs}
          {summary && <p className="text-[11px] text-textdim">{summary}</p>}
        </div>
      )}
    </div>
  );
}
