/**
 * Accent → Tailwind class map.
 *
 * Tailwind resolves class names statically, so accent variants have to be
 * written out literally somewhere. Keeping that mapping here (instead of in
 * components) means a component only ever deals with an accent *token*.
 *
 * @typedef {import('./colors').AccentToken} AccentToken
 * @typedef {object} AccentClasses
 * @property {string} solid   Filled surface with readable foreground.
 * @property {string} soft    Tinted surface with accent-coloured foreground.
 * @property {string} text    Foreground only.
 * @property {string} border  Border only.
 * @property {string} dot     Small indicator fill.
 */

/** @type {Record<AccentToken, AccentClasses>} */
export const accentClasses = {
  saffron: {
    solid: 'bg-saffron text-panel',
    soft: 'bg-saffron-soft text-saffron',
    text: 'text-saffron',
    border: 'border-saffron',
    dot: 'bg-saffron',
  },
  teal: {
    solid: 'bg-teal text-panel',
    soft: 'bg-teal-soft text-teal',
    text: 'text-teal',
    border: 'border-teal',
    dot: 'bg-teal',
  },
  coral: {
    solid: 'bg-coral text-panel',
    soft: 'bg-coral-soft text-coral',
    text: 'text-coral',
    border: 'border-coral',
    dot: 'bg-coral',
  },
  blueGrey: {
    solid: 'bg-bluegrey text-panel',
    soft: 'bg-bluegrey-soft text-bluegrey',
    text: 'text-bluegrey',
    border: 'border-bluegrey',
    dot: 'bg-bluegrey',
  },
};

/**
 * Deterministic accent for a string key, so the same product/supplier always
 * gets the same tile colour without storing it in seed data.
 * @param {string} key
 * @returns {AccentToken}
 */
export function accentForKey(key) {
  const tokens = /** @type {AccentToken[]} */ (Object.keys(accentClasses));
  let sum = 0;
  for (let i = 0; i < key.length; i += 1) sum += key.charCodeAt(i);
  return tokens[sum % tokens.length];
}

export default accentClasses;
