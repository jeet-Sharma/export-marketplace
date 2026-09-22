/**
 * Joins class names, dropping anything falsy.
 * @param {...(string | false | null | undefined)} parts
 * @returns {string}
 */
export default function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}
