import cx from '@/lib/cx';
import NavIcon from '@/components/buyer/NavIcon';

/**
 * @param {object} props
 * @param {Array<{ id: string, label: string, description: string }>} props.steps
 * @param {number} props.activeIndex
 * @returns {import('react').ReactElement}
 */
export default function StepIndicator({ steps, activeIndex }) {
  return (
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {steps.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;

        return (
          <li
            key={step.id}
            aria-current={active ? 'step' : undefined}
            className={cx(
              'flex items-start gap-2.5 rounded-sharp border p-3',
              active ? 'border-saffron bg-panel' : 'border-line bg-panel',
            )}
          >
            <span
              className={cx(
                'flex h-6 w-6 items-center justify-center rounded-sharp border font-heading text-xs',
                done && 'border-teal bg-teal text-panel',
                active && 'border-saffron bg-saffron text-panel',
                !done && !active && 'border-line bg-paper text-textdim',
              )}
            >
              {done ? <NavIcon name="check" size={12} /> : index + 1}
            </span>

            <span className="min-w-0">
              <span
                className={cx(
                  'block text-sm font-medium',
                  active || done ? 'text-text' : 'text-textdim',
                )}
              >
                {step.label}
              </span>
              <span className="mt-0.5 block text-[11px] text-textdim">{step.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
