/**
 * Product catalogue.
 *
 * @typedef {object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} supplierId
 * @property {string} category
 * @property {string} hsCode
 * @property {string} unit         Selling unit (kg, set, pc).
 * @property {number} unitPriceUsd Price per selling unit in USD.
 * @property {number} moq          Minimum order quantity in selling units.
 * @property {number} unitWeightKg Gross weight per selling unit, used for freight.
 * @property {string[]} shipsTo    Destination countries the supplier serves.
 * @property {number} leadTimeDays
 * @property {string} grade
 */

/** @type {Product[]} */
export const products = [
  {
    id: 'prd-1001',
    name: 'Malabar Black Pepper',
    supplierId: 'sup-abc',
    category: 'Spices',
    hsCode: '0904.11',
    unit: 'kg',
    unitPriceUsd: 4.2,
    moq: 200,
    unitWeightKg: 1.05,
    shipsTo: ['United States', 'Germany', 'United Arab Emirates'],
    leadTimeDays: 18,
    grade: 'ASTA 570 GL',
  },
  {
    id: 'prd-1002',
    name: 'Turmeric Finger Grade A',
    supplierId: 'sup-himalayan',
    category: 'Spices',
    hsCode: '0910.30',
    unit: 'kg',
    unitPriceUsd: 2.85,
    moq: 250,
    unitWeightKg: 1.02,
    shipsTo: ['United States', 'United Kingdom', 'Japan'],
    leadTimeDays: 21,
    grade: '4.5% Curcumin',
  },
  {
    id: 'prd-1003',
    name: 'Cotton Bed Linen Set',
    supplierId: 'sup-xyz',
    category: 'Textiles',
    hsCode: '6302.21',
    unit: 'set',
    unitPriceUsd: 12.5,
    moq: 50,
    unitWeightKg: 2.4,
    shipsTo: ['United States', 'Germany', 'United Kingdom', 'Australia'],
    leadTimeDays: 26,
    grade: '300 TC Combed',
  },
  {
    id: 'prd-1004',
    name: 'Handloom Silk Scarves',
    supplierId: 'sup-crafts',
    category: 'Handicrafts',
    hsCode: '6214.10',
    unit: 'pc',
    unitPriceUsd: 8.9,
    moq: 50,
    unitWeightKg: 0.18,
    shipsTo: ['United States', 'Germany', 'Japan'],
    leadTimeDays: 24,
    grade: 'Mulberry Silk',
  },
  {
    id: 'prd-1005',
    name: 'Brass Decorative Planter',
    supplierId: 'sup-crafts',
    category: 'Handicrafts',
    hsCode: '7418.20',
    unit: 'pc',
    unitPriceUsd: 15.4,
    moq: 40,
    unitWeightKg: 1.6,
    shipsTo: ['United States', 'United Arab Emirates', 'Australia'],
    leadTimeDays: 30,
    grade: 'Hand-hammered',
  },
  {
    id: 'prd-1006',
    name: 'Basmati Rice 1121 Steam',
    supplierId: 'sup-abc',
    category: 'Agriculture',
    hsCode: '1006.30',
    unit: 'kg',
    unitPriceUsd: 1.1,
    moq: 1000,
    unitWeightKg: 1.0,
    shipsTo: ['United Arab Emirates', 'United Kingdom', 'Germany'],
    leadTimeDays: 20,
    grade: 'Extra Long Grain',
  },
  {
    id: 'prd-1007',
    name: 'Organic Moringa Leaf Powder',
    supplierId: 'sup-himalayan',
    category: 'Agriculture',
    hsCode: '1211.90',
    unit: 'kg',
    unitPriceUsd: 6.35,
    moq: 100,
    unitWeightKg: 1.04,
    shipsTo: ['United States', 'Germany', 'Australia', 'Japan'],
    leadTimeDays: 16,
    grade: 'USDA Organic',
  },
];

/** MOQ filter buckets offered in the catalogue toolbar. */
export const moqRanges = [
  { id: 'moq-any', label: 'Any MOQ', max: Number.POSITIVE_INFINITY },
  { id: 'moq-100', label: 'Up to 100', max: 100 },
  { id: 'moq-500', label: 'Up to 500', max: 500 },
  { id: 'moq-1000', label: 'Up to 1,000', max: 1000 },
];

/**
 * @param {string} productId
 * @returns {Product | undefined}
 */
export function findProduct(productId) {
  return products.find((product) => product.id === productId);
}

export default products;
