import { orderStages } from '@/data/orders';

/**
 * @typedef {import('@/data/orders').Order} Order
 *
 * @typedef {object} TimelineStage
 * @property {string} key
 * @property {string} label
 * @property {string | null} at
 * @property {'done' | 'current' | 'error' | 'pending'} state
 */

/**
 * Builds the shipment timeline from the order's milestone dates.
 *
 * A stage is `done` once its milestone date exists. The first stage without a
 * date becomes `current`, except on a failed payment where the payment stage is
 * flagged `error` and nothing downstream can start.
 *
 * @param {Order} order
 * @returns {TimelineStage[]}
 */
export default function orderTimeline(order) {
  let currentAssigned = false;

  return orderStages.map((stage) => {
    const at = order.milestones[stage.key] ?? null;

    if (at) return { ...stage, at, state: /** @type {const} */ ('done') };

    if (stage.key === 'paidOn' && order.status === 'payment-failed') {
      currentAssigned = true;
      return { ...stage, at: null, state: /** @type {const} */ ('error') };
    }

    if (!currentAssigned) {
      currentAssigned = true;
      return { ...stage, at: null, state: /** @type {const} */ ('current') };
    }

    return { ...stage, at: null, state: /** @type {const} */ ('pending') };
  });
}
