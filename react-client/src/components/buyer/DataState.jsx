import Button from '@/components/ui/Button';
import EmptyState from './EmptyState';

/**
 * Wraps data-driven content with its loading, error and empty states so no
 * screen renders only the happy path.
 *
 * @param {object} props
 * @param {boolean} props.loading
 * @param {Error | null} props.error
 * @param {boolean} [props.isEmpty]
 * @param {() => void} [props.onRetry]
 * @param {import('react').ReactNode} [props.empty] Custom empty state.
 * @param {number} [props.skeletonRows]
 * @param {import('react').ReactNode} props.children
 * @returns {import('react').ReactElement}
 */
export default function DataState({
  loading,
  error,
  isEmpty = false,
  onRetry,
  empty,
  skeletonRows = 4,
  children,
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading</span>
        {Array.from({ length: skeletonRows }, (_, index) => (
          <div
            key={index}
            className="h-9 animate-pulse rounded-sharp border border-line bg-paper"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-10 text-center">
        <h3 className="font-heading text-sm font-semibold text-coral">
          Something went wrong
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-xs text-textdim">{error.message}</p>
        {onRetry && (
          <div className="mt-3">
            <Button variant="ghost" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <>
        {empty ?? (
          <EmptyState
            icon="search"
            title="Nothing to show"
            description="No records match the current filters."
          />
        )}
      </>
    );
  }

  return <>{children}</>;
}
