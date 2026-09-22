/**
 * Case-insensitive substring match across several fields.
 * An empty query matches everything, which keeps filter chains simple.
 *
 * @param {string} query
 * @param {Array<string | number | null | undefined>} fields
 * @returns {boolean}
 */
export default function matchesQuery(query, fields) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return fields.some((field) =>
    field === null || field === undefined
      ? false
      : String(field).toLowerCase().includes(needle),
  );
}
