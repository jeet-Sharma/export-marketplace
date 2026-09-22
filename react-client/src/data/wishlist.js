/**
 * Saved products.
 *
 * @typedef {object} WishlistEntry
 * @property {string} productId
 * @property {string} savedOn
 */

/** @type {WishlistEntry[]} */
export const wishlistSeedEntries = [
  { productId: 'prd-1002', savedOn: '2026-09-09' },
  { productId: 'prd-1004', savedOn: '2026-09-13' },
  { productId: 'prd-1005', savedOn: '2026-09-17' },
];

export const wishlistCopy = {
  emptyTitle: 'Your wishlist is empty',
  emptyDescription: 'Save products while browsing and compare them here before you send an RFQ.',
  browseLabel: 'Browse Products',
};

export default wishlistSeedEntries;
