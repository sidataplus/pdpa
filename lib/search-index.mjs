/**
 * Helpers for the generated search index.
 *
 * The compact format keeps `public/search-index.json` smaller:
 *   [slug, title, type, text]
 *
 * The UI can still work with the readable object format after normalization:
 *   { slug, title, type, text }
 */

/**
 * Build one compact search entry.
 *
 * @param {string} slug
 * @param {Object} note
 * @param {string} text
 * @returns {[string, string, string, string]}
 */
export function compactSearchEntry(slug, note, text) {
  let type = 'article';
  if (note.isReference) type = 'reference';
  else if (slug === 'about' || slug === 'index') type = 'other';

  return [slug, note.title, type, text];
}

/**
 * Normalize compact search data back into readable objects for the UI.
 *
 * @param {Array} data
 * @returns {Array<{slug: string, title: string, type: string, text: string}>}
 */
export function normalizeSearchIndex(data) {
  if (!Array.isArray(data)) return [];

  return data.map((item) =>
    Array.isArray(item)
      ? { slug: item[0], title: item[1], type: item[2], text: item[3] }
      : item
  );
}
