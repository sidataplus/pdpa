/** @jsxImportSource theme-ui */
'use client';
// Port of gatsby-theme-andy/src/components/BrainNoteContainer.js
// Drives the horizontally-stacked notes. Navigation is done with the History
// API (pushState/popstate) instead of Gatsby's router; the rest is unchanged.
import React from 'react';
import { Flex, Box } from 'theme-ui';
import useWindowWidth from './useWindowWidth';
import Header from './Header';
import BrainNote from './BrainNote';
import { LinkToStacked } from './LinkToStacked';
import {
  useStackedPagesProvider,
  StackedPagesProvider,
  PageIndexProvider,
} from '../lib/stacked';
import { NOTE_WIDTH, MOBILE_BREAKPOINT } from '../lib/constants';

/**
 * A wrapper for individual stacked pages.
 * Provides the PageIndexProvider context so child components know their position
 * in the horizontally-scrolling stack.
 * 
 * @param {Object} props
 * @param {number} props.i - The index of the page in the stack.
 */
const StackedPageWrapper = React.memo(function StackedPageWrapper({ i, ...rest }) {
  return (
    <PageIndexProvider value={i}>
      <NoteWrapper {...rest} i={i} />
    </PageIndexProvider>
  );
});

// Wrapper for a single stacked column.
const NoteWrapper = React.memo(function NoteWrapper({ children, slug, title, overlay, obstructed, highlighted, i }) {
  return (
  <Flex
    bg={highlighted ? 'accent' : 'background'}
    px={3}
    className="note-container"
    sx={{
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto',
      position: [null, null, 'sticky'],
      maxWidth: ['100%', '100%', '100vw'],
      boxShadow: overlay ? `0 0 8px rgba(0, 0, 0, 0.125)` : '',
      width: ['100%', '100%', NOTE_WIDTH],
      left: 40 * i,
      right: -585,
    }}
  >
    <Box
      sx={{
        display: ['none', 'none', 'block'],
        transition: 'opacity',
        transitionDuration: 100,
        opacity: obstructed ? 1 : 0,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          zIndex: 10,
          transform: 'rotate(90deg)',
          transformOrigin: 'left',
        }}
        pb={2}
      >
        <LinkToStacked to={slug} sx={{ fontWeight: 'bold', textDecoration: 'none', color: 'text' }}>
          {title || slug}
        </LinkToStacked>
      </Box>
    </Box>
    <Flex
      sx={{
        flexDirection: 'column',
        minHeight: '100%',
        transition: 'opacity',
        transitionDuration: 100,
        opacity: obstructed ? 0 : 1,
      }}
    >
      {children}
    </Flex>
  </Flex>
  );
});

export default function BrainNoteContainer({ slug, note, siteMetadata }) {
  const [width] = useWindowWidth();

  // Manage the query string (?stackedPages=...) via the History API.
  const [search, setSearch] = React.useState('');
  React.useEffect(() => {
    // On first visit to the about page on a wide-enough screen, default-open
    // มาตรา ๑ as the second column so the layout doesn't look mostly empty.
    const params = new URLSearchParams(window.location.search.replace(/^\?/, ''));
    // Require enough width for two full columns side by side (not just the
    // >=768px "desktop" breakpoint) — otherwise the default second column
    // heavily overlaps the first on tablet-width screens (e.g. iPad @768px).
    if (slug === 'about' && !params.has('stackedPages') && window.innerWidth >= NOTE_WIDTH * 2) {
      // Matches the leading-slash slug format LinkToStacked/AnchorTag use for
      // `to`/`href`, so the "already open" fast path in navigateToStackedPage
      // recognizes this column instead of re-pushing a duplicate on re-click.
      params.set('stackedPages', '/article-1');
      const qs = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    }
    setSearch(window.location.search);
    const onPop = () => setSearch(window.location.search);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [slug]);

  const navigate = React.useCallback((url) => {
    window.history.pushState(null, '', url);
    setSearch(window.location.search);
  }, []);

  const firstPage = React.useMemo(() => ({ slug, data: note }), [slug, note]);
  const location = React.useMemo(() => ({ search }), [search]);

  const [state, scrollContainer] = useStackedPagesProvider({
    firstPage,
    location,
    navigate,
    pageWidth: NOTE_WIDTH,
  });
  const { stackedPages, stackedPageStates } = state;

  let pages = stackedPages;
  let indexToShow;
  if (width < MOBILE_BREAKPOINT) {
    const activeSlug = Object.keys(stackedPageStates).find((s) => stackedPageStates[s].active);
    indexToShow = stackedPages.findIndex((page) => page.slug === activeSlug);
    if (indexToShow === -1) indexToShow = stackedPages.length - 1;
    pages = [stackedPages[indexToShow]];
  }

  return (
    <Flex sx={{ flexDirection: 'column', height: '100vh', minHeight: '100vh' }}>
      <Header siteMetadata={siteMetadata} navigateToStackedPage={state.navigateToStackedPage} />

      <Flex
        ref={scrollContainer}
        sx={{
          flex: 1,
          flexGrow: 1,
          overflowX: [null, null, 'auto'],
          overflowY: 'hidden',
        }}
      >
        <Flex
          className="note-columns-container"
          sx={{
            minWidth: 'unset',
            flexGrow: 1,
            transition: [null, null, 'width'],
            transitionDuration: 100,
            width: ['100%', '100%', NOTE_WIDTH * (pages.length + 1)],
          }}
        >
          <StackedPagesProvider value={state}>
            {pages.map((page, i) => (
              <StackedPageWrapper
                i={i}
                key={page.slug}
                slug={page.slug}
                title={page.data && page.data.title}
                overlay={stackedPageStates[page.slug] && stackedPageStates[page.slug].overlay}
                obstructed={
                  indexToShow !== undefined
                    ? false
                    : stackedPageStates[page.slug] && stackedPageStates[page.slug].obstructed
                }
                highlighted={
                  stackedPageStates[page.slug] && stackedPageStates[page.slug].highlighted
                }
              >
                <BrainNote note={page.data} />
              </StackedPageWrapper>
            ))}
          </StackedPagesProvider>
        </Flex>
      </Flex>
    </Flex>
  );
}
