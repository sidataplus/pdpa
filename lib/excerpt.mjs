// Approximate Gatsby's MDX `excerpt(pruneLength: 280, truncate: true)`.
import { stripMarkdown } from './strip-markdown.mjs';

/**
 * Convert markdown to plain text and truncate to the given length.
 *
 * @param {string} markdown - Raw markdown content.
 * @param {number} pruneLength - Maximum character count (default 280).
 * @returns {string} Plain-text excerpt.
 */
export default function makeExcerpt(markdown, pruneLength = 280) {
  const text = stripMarkdown(markdown);
  return text.length > pruneLength ? text.substring(0, pruneLength) : text;
}
