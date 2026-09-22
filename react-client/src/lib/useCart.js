'use client';

import { createContext, useContext, useMemo, useReducer } from 'react';
import { cartSeedLines, shippingMethods } from '@/data/cart';
import { buyerProfile } from '@/data/profile';
import { wishlistSeedEntries } from '@/data/wishlist';

/**
 * Cart and wishlist store.
 *
 * All mutations go through one reducer so the shopping rules live in a single
 * place. Swapping this for a persisted store (API or localStorage) means
 * replacing the dispatch plumbing only — no screen changes.
 *
 * @typedef {import('@/data/cart').CartLine} CartLine
 * @typedef {import('@/data/wishlist').WishlistEntry} WishlistEntry
 *
 * @typedef {object} CartState
 * @property {CartLine[]} lines
 * @property {WishlistEntry[]} wishlist
 * @property {string} destinationCountry
 * @property {string} currencyCode
 * @property {string} shippingMethodId
 */

/** @type {CartState} */
const initialState = {
  lines: cartSeedLines,
  wishlist: wishlistSeedEntries,
  destinationCountry: buyerProfile.country,
  currencyCode: buyerProfile.preferredCurrency,
  shippingMethodId: shippingMethods[0].id,
};

/** @returns {string} Today as an ISO date, used when saving a wishlist entry. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {CartState} state
 * @param {{ type: string, [key: string]: unknown }} action
 * @returns {CartState}
 */
export function cartReducer(state, action) {
  switch (action.type) {
    case 'cart/add': {
      const productId = /** @type {string} */ (action.productId);
      const quantity = /** @type {number} */ (action.quantity);
      const existing = state.lines.find((line) => line.productId === productId);

      // Adding a product already in the cart tops up the quantity instead of
      // creating a duplicate line.
      return {
        ...state,
        lines: existing
          ? state.lines.map((line) =>
              line.productId === productId
                ? { ...line, quantity: line.quantity + quantity }
                : line,
            )
          : [...state.lines, { productId, quantity }],
      };
    }

    case 'cart/setQuantity': {
      const productId = /** @type {string} */ (action.productId);
      const quantity = Math.max(1, /** @type {number} */ (action.quantity));

      return {
        ...state,
        lines: state.lines.map((line) =>
          line.productId === productId ? { ...line, quantity } : line,
        ),
      };
    }

    case 'cart/remove':
      return {
        ...state,
        lines: state.lines.filter((line) => line.productId !== action.productId),
      };

    case 'cart/clear':
      return { ...state, lines: [] };

    case 'wishlist/toggle': {
      const productId = /** @type {string} */ (action.productId);
      const saved = state.wishlist.some((entry) => entry.productId === productId);

      return {
        ...state,
        wishlist: saved
          ? state.wishlist.filter((entry) => entry.productId !== productId)
          : [...state.wishlist, { productId, savedOn: today() }],
      };
    }

    case 'wishlist/remove':
      return {
        ...state,
        wishlist: state.wishlist.filter((entry) => entry.productId !== action.productId),
      };

    case 'wishlist/moveToCart': {
      const productId = /** @type {string} */ (action.productId);
      const withProduct = cartReducer(state, {
        type: 'cart/add',
        productId,
        quantity: action.quantity,
      });

      return {
        ...withProduct,
        wishlist: withProduct.wishlist.filter((entry) => entry.productId !== productId),
      };
    }

    case 'preferences/setDestination':
      return { ...state, destinationCountry: /** @type {string} */ (action.country) };

    case 'preferences/setCurrency':
      return { ...state, currencyCode: /** @type {string} */ (action.currencyCode) };

    case 'preferences/setShippingMethod':
      return { ...state, shippingMethodId: /** @type {string} */ (action.methodId) };

    default:
      return state;
  }
}

const CartContext = createContext(/** @type {ReturnType<typeof buildStore> | null} */ (null));

/**
 * @param {CartState} state
 * @param {(action: { type: string, [key: string]: unknown }) => void} dispatch
 */
function buildStore(state, dispatch) {
  return {
    ...state,
    lineCount: state.lines.length,
    wishlistCount: state.wishlist.length,

    /** @param {string} productId */
    isInCart: (productId) => state.lines.some((line) => line.productId === productId),
    /** @param {string} productId */
    isWishlisted: (productId) =>
      state.wishlist.some((entry) => entry.productId === productId),

    /** @param {string} productId @param {number} quantity */
    addToCart: (productId, quantity) => dispatch({ type: 'cart/add', productId, quantity }),
    /** @param {string} productId @param {number} quantity */
    setQuantity: (productId, quantity) =>
      dispatch({ type: 'cart/setQuantity', productId, quantity }),
    /** @param {string} productId */
    removeFromCart: (productId) => dispatch({ type: 'cart/remove', productId }),
    clearCart: () => dispatch({ type: 'cart/clear' }),

    /** @param {string} productId */
    toggleWishlist: (productId) => dispatch({ type: 'wishlist/toggle', productId }),
    /** @param {string} productId */
    removeFromWishlist: (productId) => dispatch({ type: 'wishlist/remove', productId }),
    /** @param {string} productId @param {number} quantity */
    moveToCart: (productId, quantity) =>
      dispatch({ type: 'wishlist/moveToCart', productId, quantity }),

    /** @param {string} country */
    setDestinationCountry: (country) =>
      dispatch({ type: 'preferences/setDestination', country }),
    /** @param {string} currencyCode */
    setCurrencyCode: (currencyCode) =>
      dispatch({ type: 'preferences/setCurrency', currencyCode }),
    /** @param {string} methodId */
    setShippingMethodId: (methodId) =>
      dispatch({ type: 'preferences/setShippingMethod', methodId }),
  };
}

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const store = useMemo(() => buildStore(state, dispatch), [state]);

  return <CartContext.Provider value={store}>{children}</CartContext.Provider>;
}

/**
 * @returns {ReturnType<typeof buildStore>}
 */
export default function useCart() {
  const store = useContext(CartContext);
  if (!store) throw new Error('useCart must be used inside a CartProvider.');
  return store;
}
