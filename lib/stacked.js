'use client';
// Port of `react-stacked-pages-hook` (lib/hooks.js + contexts.js) with the
// Gatsby-specific bits replaced:
//   - window.___loader.loadPage(slug)  →  fetch('/notes/<slug>.json')
//   - gatsby `navigate()`              →  a `navigate` callback (history.pushState)
//   - gatsby `withPrefix()`            →  identity (no path prefix)
// The scroll/obstruction physics are kept identical for visual parity.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import throttle from 'lodash.throttle';
import isEqual from 'lodash.isequal';
import { SCROLL_THROTTLE_MS, OBSTRUCTED_OFFSET } from './constants';

// ---- Contexts ----
export const StackedPagesContext = createContext({
  stackedPages: [],
  stackedPageStates: {},
  navigateToStackedPage: () => {},
  highlightStackedPage: () => {},
});
export const StackedPagesIndexContext = createContext(0);
export const StackedPagesProvider = StackedPagesContext.Provider;
export const PageIndexProvider = StackedPagesIndexContext.Provider;

// Session-level in-memory cache for fetched note JSON.
// Prevents redundant network requests when the user navigates back to a page
// they have already opened in the current browser session.
const noteCache = new Map();

/**
 * Fetches the JSON data for a specific note/page.
 * Mirrors Gatsby's lazy loadPage functionality.
 * Link targets usually carry a leading slash (e.g. "/article-1"),
 * but JSON files are named by bare slug ("article-1.json").
 *
 * @param {string} slug - The slug or path of the note to load.
 * @returns {Promise<Object|null>} The parsed JSON data for the note, or null on failure.
 */
async function loadNote(slug) {
  const bare = String(slug).replace(/^\/+/, '').replace(/\/+$/, '');

  // Return cached data to avoid redundant fetches within the same session
  if (noteCache.has(bare)) return noteCache.get(bare);

  try {
    const isDev = process.env.NODE_ENV === 'development';
    // In development, bypass the HTTP cache so edits to content are reflected immediately.
    const url = `/notes/${encodeURIComponent(bare)}.json${isDev ? `?t=${Date.now()}` : ''}`;
    const res = await fetch(url, { cache: isDev ? 'no-store' : 'default' });
    if (!res.ok) return null;
    const data = await res.json();
    noteCache.set(bare, data);
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * Tracks the horizontal scroll position and width of the stacked-pages container.
 * Throttled to ~60 fps to avoid excessive re-renders during fast scrolling.
 *
 * @returns {[number, number, Function, React.MutableRefObject]}
 *   [scrollLeft, containerWidth, setRef callback, containerRef]
 */
function useScroll() {
  const containerRef = useRef(null);
  const [scroll, setScroll] = useState(0);
  const [width, setWidth] = useState(0);

  const scrollObserver = useCallback(() => {
    if (!containerRef.current) return;
    setScroll(containerRef.current.scrollLeft);
    setWidth(containerRef.current.getBoundingClientRect().width);
  }, [setScroll, setWidth, containerRef]);

  const throttledScrollObserver = throttle(scrollObserver, SCROLL_THROTTLE_MS);

  const setRef = useCallback((node) => {
    if (node) {
      node.addEventListener('scroll', throttledScrollObserver);
      containerRef.current = node;
      window.addEventListener('resize', throttledScrollObserver);
      throttledScrollObserver();
    } else if (containerRef.current) {
      containerRef.current.removeEventListener('scroll', throttledScrollObserver);
      window.removeEventListener('resize', throttledScrollObserver);
      // Cancel any pending throttled call to prevent post-unmount state updates
      throttledScrollObserver.cancel?.();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [scroll, width, setRef, containerRef];
}

function getRoot(firstPage) {
  return firstPage ? [firstPage] : [];
}

/**
 * Top-level hook that manages the stacked-pages state machine.
 * Reads the initial stack from `?stackedPages=` query params, fetches each
 * note's JSON lazily, and exposes navigation + highlight callbacks.
 *
 * @param {Object} options
 * @param {Object} options.location     - Object with a `search` string (window.location.search).
 * @param {Object} options.firstPage    - The root page: `{ slug, data }`.
 * @param {Function} options.navigate   - Callback to push a new URL (history.pushState wrapper).
 * @param {number} [options.pageWidth=625]          - Width of each stacked column in px.
 * @param {number} [options.obstructedPageWidth=40] - Width of a collapsed column in px.
 * @returns {[Object, Function]} [contextValue, scrollContainerRef]
 */
export function useStackedPagesProvider({ location, firstPage, navigate, pageWidth = 625, obstructedPageWidth = 40 }) {
  const previousFirstPage = useRef(firstPage);
  const [scroll, containerWidth, setRef, containerRef] = useScroll();
  const [stackedPages, setStackedPages] = useState(getRoot(firstPage));
  const [stackedPageStates, setStackedPageStates] = useState(
    firstPage
      ? {
          [firstPage.slug]: {
            obstructed: false,
            highlighted: false,
            overlay: scroll > pageWidth - OBSTRUCTED_OFFSET,
            active: true,
          },
        }
      : {}
  );

  // Slugs of the pages stacked after the first one, taken from ?stackedPages=...
  // Normalized to bare slugs (no leading slash) so they compare equal to `to`
  // values regardless of whether the caller passed "article-1" or "/article-1".
  const stackedPagesSlugs = useMemo(() => {
    const params = new URLSearchParams((location.search || '').replace(/^\?/, ''));
    return params.getAll('stackedPages').map((s) => s.replace(/^\/+/, ''));
  }, [location]);

  // When the root page changes (navigating to a different first page), keep the tail
  useEffect(() => {
    if (isEqual(firstPage, previousFirstPage.current)) return;
    setStackedPages((pages) =>
      getRoot(firstPage).concat(previousFirstPage.current ? pages.slice(1) : pages)
    );
    previousFirstPage.current = firstPage;
  }, [firstPage]);

  // Dynamically fetch the stacked notes listed in the query string
  useEffect(() => {
    let cancelled = false;
    Promise.all(stackedPagesSlugs.map((slug) => loadNote(slug))).then((data) => {
      if (cancelled) return;
      setStackedPages(
        getRoot(firstPage).concat(
          data
            .map((note, i) => ({ slug: stackedPagesSlugs[i], data: note }))
            .filter((x) => x.data)
        )
      );
    });
    return () => {
      cancelled = true;
    };
  }, [stackedPagesSlugs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll the newest page into view
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        left: pageWidth * (stackedPages.length + 1),
        behavior: 'instant',
      });
    }
  }, [stackedPages, containerRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recompute overlay/obstructed states on scroll or when pages change.
  // "overlay" = the page is scrolled mostly out of view to the left or right.
  // "obstructed" = the page is partially hidden behind another page's sticky header.
  useEffect(() => {
    const acc = {};
    if (!containerRef.current) {
      setStackedPageStates(
        stackedPages.reduce((prev, x, i, a) => {
          prev[x.slug] = {
            overlay: true,
            obstructed: false,
            highlighted: false,
            active: i === a.length - 1,
          };
          return prev;
        }, acc)
      );
      return;
    }
    setStackedPageStates(
      stackedPages.reduce((prev, x, i, a) => {
        prev[x.slug] = {
          highlighted: false,
          overlay:
            scroll > Math.max(pageWidth * (i - 1) - (obstructedPageWidth * i - 2), 0) ||
            scroll < Math.max(0, pageWidth * (i - 2)),
          obstructed:
            scroll >
              Math.max(pageWidth * (i + 1) - OBSTRUCTED_OFFSET - obstructedPageWidth * (i - 1), 0) ||
            scroll + containerWidth < pageWidth * i + OBSTRUCTED_OFFSET,
          active: i === a.length - 1,
        };
        return prev;
      }, acc)
    );
  }, [stackedPages, containerRef, scroll, containerWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateToStackedPage = useCallback(
    (to, index = 0) => {
      // Callers pass slugs both bare ("article-1", from search results) and
      // slash-prefixed ("/article-1", from LinkToStacked/AnchorTag hrefs).
      // Normalize so the "already open" fast path below reliably matches.
      const bareTo = String(to).replace(/^\/+/, '');
      const existingPage = stackedPages.findIndex((x) => x.slug === bareTo);
      if (existingPage !== -1 && containerRef && containerRef.current) {
        setStackedPageStates((states) => {
          if (!states[bareTo]) return states;
          return Object.keys(states).reduce((prev, slug) => {
            prev[slug] = { ...states[slug], highlighted: false, active: slug === bareTo };
            return prev;
          }, {});
        });
        containerRef.current.scrollTo({
          top: 0,
          left: pageWidth * existingPage - (obstructedPageWidth * existingPage - 1),
          behavior: 'instant',
        });
        return;
      }
      const params = new URLSearchParams(window.location.search.replace(/^\?/, ''));
      params.delete('stackedPages');
      stackedPages
        .slice(1, index + 1)
        .map((x) => x.slug)
        .concat(bareTo)
        .forEach((slug) => params.append('stackedPages', slug));
      const qs = params.toString();
      navigate(`${window.location.pathname}${qs ? `?${qs}` : ''}`);
    },
    [stackedPages, navigate, containerRef, pageWidth, obstructedPageWidth]
  );

  const highlightStackedPage = useCallback((rawSlug, highlighted) => {
    const slug = String(rawSlug).replace(/^\/+/, '');
    setStackedPageStates((states) => {
      if (!states[slug]) return states;
      return {
        ...states,
        [slug]: {
          ...states[slug],
          highlighted: typeof highlighted !== 'undefined' ? highlighted : !states[slug].highlighted,
        },
      };
    });
  }, []);

  const contextValue = useMemo(
    () => ({ stackedPages, navigateToStackedPage, highlightStackedPage, stackedPageStates }),
    [stackedPages, navigateToStackedPage, highlightStackedPage, stackedPageStates]
  );

  return [contextValue, setRef];
}

/**
 * Per-column hook: returns the data and state for the page at the current stack index.
 *
 * @returns {[Object, Object, number, Function, Function]}
 *   [currentPage, pageState, index, navigateToStackedPage, highlightStackedPage]
 *
 *   - currentPage: `{ slug, data }` for this column
 *   - pageState:   `{ overlay, obstructed, highlighted, active }`
 *   - index:       position of this column in the stack (0 = root)
 *   - navigateToStackedPage(slug): push a new page onto the stack from this column
 *   - highlightStackedPage(slug, bool): highlight/unhighlight a column
 */
export function useStackedPage() {
  const { stackedPages, stackedPageStates, navigateToStackedPage, highlightStackedPage } =
    useContext(StackedPagesContext);
  const index = useContext(StackedPagesIndexContext);
  const hookedNavigateToStackedPage = useCallback(
    (to) => navigateToStackedPage(to, index),
    [navigateToStackedPage, index]
  );
  const currentPage = stackedPages[index];
  return [
    currentPage,
    currentPage ? stackedPageStates[currentPage.slug] : {},
    index,
    hookedNavigateToStackedPage,
    highlightStackedPage,
  ];
}
