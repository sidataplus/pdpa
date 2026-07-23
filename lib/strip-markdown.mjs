// Shared utility: convert markdown/HTML to plain text.
// Used by both excerpt.mjs (for popover previews) and gen-public.mjs (for search index).

const HTML_ENTITIES = {
  '&emsp;': ' ',
  '&ensp;': ' ',
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

/**
 * Strip markdown syntax and HTML tags/entities from a string,
 * returning plain readable text suitable for search or excerpts.
 *
 * @param {string} markdown - Raw markdown content.
 * @returns {string} Plain text with whitespace collapsed.
 */
export function stripMarkdown(markdown) {
  let text = markdown || '';

  // Remove images, then convert links to their display text
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1'); // reference-style links

  // Remove wiki-links [[text]] -> text
  text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');

  // Remove heading markers, blockquote markers, list markers
  text = text.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');
  text = text.replace(/^[ \t]*>[ \t]?/gm, '');
  text = text.replace(/^[ \t]*([-*+]|\d+\.)[ \t]+/gm, '');

  // Remove emphasis, inline code, remaining markdown characters
  text = text.replace(/[*_`~]/g, '');
  text = text.replace(/[#>-]/g, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text.replace(/&[a-z]+;|&#\d+;/gi, (m) => HTML_ENTITIES[m] || ' ');

  // Collapse all whitespace
  return text.replace(/\s+/g, ' ').trim();
}
