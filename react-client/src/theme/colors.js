/**
 * Single source of truth for every colour in the application.
 *
 * Components never read these hex values directly — they use the Tailwind
 * utilities registered in `globals.css` (`bg-panel`, `text-textdim`, ...).
 * Those utilities resolve to the CSS custom properties emitted below, which is
 * why this file is the only place a hex literal is allowed to exist.
 *
 * @typedef {keyof typeof colors} ColorToken
 * @typedef {'saffron' | 'teal' | 'coral' | 'blueGrey'} AccentToken
 */

export const colors = {
  ink: '#10213A',
  paper: '#F6F4EE',
  panel: '#FFFFFF',
  line: '#E4DFD2',

  saffron: '#C97A1A',
  saffronSoft: '#F3E3C8',

  teal: '#2F7D6E',
  tealSoft: '#DCEDE8',

  coral: '#B84A3B',
  coralSoft: '#F5DFDA',

  blueGrey: '#3A4E7A',
  blueGreySoft: '#E4E9F5',

  text: '#1B2333',
  textDim: '#66707F',
};

/** Accent tokens usable for status pills, letter tiles and emphasis. */
export const accentTokens = /** @type {AccentToken[]} */ ([
  'saffron',
  'teal',
  'coral',
  'blueGrey',
]);

/**
 * CSS custom property name for a colour token.
 * @param {ColorToken} token
 * @returns {string}
 */
export function cssVariableName(token) {
  return `--c-${token}`;
}

/**
 * The `:root` declaration block that backs every Tailwind colour utility.
 * Rendered once by `ThemeStyles` so the palette stays defined in JavaScript.
 * @type {string}
 */
export const rootColorVariables = `:root{${Object.entries(colors)
  .map(([token, value]) => `${cssVariableName(/** @type {ColorToken} */ (token))}:${value};`)
  .join('')}}`;

export default colors;
