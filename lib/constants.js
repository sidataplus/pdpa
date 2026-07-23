// Central place for shared constants.
// Import from here instead of using bare numbers in component files.

// --- Layout ---

/** Width of each stacked note column (px). Matches the original Gatsby NOTE_WIDTH. */
export const NOTE_WIDTH = 576;

/** Viewport width (px) below which the app switches to single-column mobile layout. */
export const MOBILE_BREAKPOINT = 768;

/**
 * How far (px) from the left edge a page must scroll before it is considered
 * "obstructed" and shows only its title rotated vertically.
 */
export const OBSTRUCTED_OFFSET = 120;

/** Scroll/resize event throttle interval in ms (~1 frame at 60 fps). */
export const SCROLL_THROTTLE_MS = 16;

// --- Search ---

/** Characters of context shown before/after a search match in snippets. */
export const SEARCH_SNIPPET_CONTEXT = 30;

/** Maximum number of search results to display. */
export const SEARCH_MAX_RESULTS = 20;

/** Score bonus when the search term matches the note title. */
export const SEARCH_TITLE_SCORE = 10;

/** Score bonus when the search term matches the note body text. */
export const SEARCH_TEXT_SCORE = 1;
