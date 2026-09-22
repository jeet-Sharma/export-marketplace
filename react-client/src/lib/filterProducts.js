import matchesQuery from './matchesQuery';

/**
 * @typedef {import('@/data/products').Product & { supplier: import('@/data/suppliers').Supplier | null }} CatalogProduct
 *
 * @typedef {object} ProductFilters
 * @property {string} query
 * @property {string} category  Empty string means "all categories".
 * @property {number} moqMax    Upper MOQ bound, Infinity for "any".
 * @property {string} country   Empty string means "all destinations".
 */

/**
 * @param {CatalogProduct[]} products
 * @param {ProductFilters} filters
 * @returns {CatalogProduct[]}
 */
export default function filterProducts(products, filters) {
  return products.filter((product) => {
    const matchesText = matchesQuery(filters.query, [
      product.name,
      product.category,
      product.hsCode,
      product.grade,
      product.supplier?.name,
    ]);
    const matchesCategory = !filters.category || product.category === filters.category;
    const matchesMoq = product.moq <= filters.moqMax;
    const matchesCountry = !filters.country || product.shipsTo.includes(filters.country);

    return matchesText && matchesCategory && matchesMoq && matchesCountry;
  });
}

/**
 * Category options derived from the catalogue itself, so a new product never
 * needs a matching filter entry.
 * @param {CatalogProduct[]} products
 * @returns {string[]}
 */
export function productCategories(products) {
  return [...new Set(products.map((product) => product.category))].sort();
}

/**
 * Destination options derived from what suppliers actually ship to.
 * @param {CatalogProduct[]} products
 * @returns {string[]}
 */
export function productDestinations(products) {
  return [...new Set(products.flatMap((product) => product.shipsTo))].sort();
}
