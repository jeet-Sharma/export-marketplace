import { orders, findOrder } from '@/data/orders';
import { products, findProduct } from '@/data/products';
import { rfqs, findRfq } from '@/data/rfq';
import { suppliers, findSupplier } from '@/data/suppliers';
import {
  addresses,
  buyerProfile,
  paymentMethods,
  transactions,
} from '@/data/profile';

/**
 * Read-only data access layer.
 *
 * Every screen talks to this module instead of importing seed files directly,
 * so swapping the in-memory fixtures for HTTP calls is a change in one place.
 * The small delay keeps the loading states on real code paths.
 */
const LATENCY_MS = 180;

/**
 * @template T
 * @param {T} value
 * @returns {Promise<T>}
 */
function respond(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), LATENCY_MS);
  });
}

/**
 * @param {string} message
 * @returns {Promise<never>}
 */
function fail(message) {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(message)), LATENCY_MS);
  });
}

/** @param {import('@/data/products').Product} product */
function joinProduct(product) {
  return { ...product, supplier: findSupplier(product.supplierId) ?? null };
}

/** @param {import('@/data/orders').Order} order */
function joinOrder(order) {
  return {
    ...order,
    product: findProduct(order.productId) ?? null,
    supplier: findSupplier(order.supplierId) ?? null,
  };
}

/** @param {import('@/data/rfq').Rfq} rfq */
function joinRfq(rfq) {
  return {
    ...rfq,
    product: findProduct(rfq.productId) ?? null,
    quotes: rfq.quotes.map((quote) => ({
      ...quote,
      supplier: findSupplier(quote.supplierId) ?? null,
    })),
  };
}

const api = {
  /** @returns {Promise<{ orders: ReturnType<typeof joinOrder>[], rfqs: ReturnType<typeof joinRfq>[], suppliers: import('@/data/suppliers').Supplier[] }>} */
  getDashboard: () =>
    respond({
      orders: orders.map(joinOrder),
      rfqs: rfqs.map(joinRfq),
      suppliers: [...suppliers],
    }),

  getProducts: () => respond(products.map(joinProduct)),

  /** @param {string} productId */
  getProduct: (productId) => {
    const product = findProduct(productId);
    return product
      ? respond(joinProduct(product))
      : fail(`Product ${productId} could not be found.`);
  },

  getOrders: () => respond(orders.map(joinOrder)),

  /** @param {string} orderId */
  getOrder: (orderId) => {
    const order = findOrder(orderId);
    return order ? respond(joinOrder(order)) : fail(`Order ${orderId} could not be found.`);
  },

  getRfqs: () => respond(rfqs.map(joinRfq)),

  /** @param {string} rfqId */
  getRfq: (rfqId) => {
    const rfq = findRfq(rfqId);
    return rfq ? respond(joinRfq(rfq)) : fail(`RFQ ${rfqId} could not be found.`);
  },

  getSuppliers: () => respond([...suppliers]),

  getProfile: () =>
    respond({
      profile: buyerProfile,
      addresses: [...addresses],
      paymentMethods: [...paymentMethods],
      transactions: [...transactions],
      suppliers: [...suppliers],
    }),
};

export default api;
