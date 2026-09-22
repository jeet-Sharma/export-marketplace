import cx from '@/lib/cx';
import formatDate from '@/lib/formatDate';
import NavIcon from '@/components/buyer/NavIcon';

/** @type {Record<import('@/lib/orderTimeline').TimelineStage['state'], string>} */
const MARKER_CLASSES = {
  done: 'border-teal bg-teal text-panel',
  current: 'border-saffron bg-saffron-soft text-saffron',
  error: 'border-coral bg-coral text-panel',
  pending: 'border-line bg-paper text-textdim',
};

/** @type {Record<import('@/lib/orderTimeline').TimelineStage['state'], string>} */
const LABEL_CLASSES = {
  done: 'text-text',
  current: 'text-text',
  error: 'text-coral',
  pending: 'text-textdim',
};

const STAGE_HINTS = {
  current: 'In progress',
  error: 'Action required',
  pending: 'Not started',
};

/**
 * Step-by-step shipment progress.
 *
 * @param {object} props
 * @param {import('@/lib/orderTimeline').TimelineStage[]} props.stages
 * @returns {import('react').ReactElement}
 */
export default function TrackingTimeline({ stages }) {
  return (
    <ol className="space-y-0">
      {stages.map((stage, index) => (
        <li key={stage.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cx(
                'flex h-6 w-6 items-center justify-center rounded-sharp border',
                MARKER_CLASSES[stage.state],
              )}
            >
              {stage.state === 'done' && <NavIcon name="check" size={12} />}
              {stage.state === 'error' && <NavIcon name="alert" size={12} />}
            </span>

            {index < stages.length - 1 && (
              <span
                className={cx(
                  'w-px flex-1',
                  stage.state === 'done' ? 'bg-teal' : 'bg-line',
                )}
              />
            )}
          </div>

          <div className={cx('pb-5', index === stages.length - 1 && 'pb-0')}>
            <p className={cx('text-sm font-medium', LABEL_CLASSES[stage.state])}>
              {stage.label}
            </p>
            <p className="mt-0.5 font-heading text-[11px] tabular-nums text-textdim">
              {stage.at ? formatDate(stage.at) : STAGE_HINTS[stage.state]}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
