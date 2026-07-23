/** @jsxImportSource theme-ui */
'use client';
// Port of gatsby-theme-andy/src/components/CustomLinkToStacked.js
// Renders a plain <a> (the original used Gatsby <Link>) and intercepts clicks
// to push the target onto the stack instead of doing a full navigation.
import React, { useCallback, useRef } from 'react';
import { prefetchNote, useStackedPage } from '../lib/stacked';

export const LinkToStacked = React.forwardRef(function LinkToStacked(
  { to, onClick, onMouseLeave, onMouseEnter, onFocus, ...restProps },
  ref
) {
  const [, , , navigateToStackedPage, highlightStackedPage] = useStackedPage();
  const highlightTimer = useRef(null);
  const href = String(to).startsWith('/') ? String(to) : `/${to}`;

  const onClickHandler = useCallback(
    (ev) => {
      if (onClick) onClick(ev);
      if (ev.defaultPrevented) return;

      // Open modifier-clicks explicitly so stacked navigation also behaves
      // consistently in browsers that do not apply their native anchor action.
      if (ev.metaKey || ev.ctrlKey) {
        ev.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }

      // Preserve other native browser actions such as middle-click and Shift+click.
      if (ev.button !== 0 || ev.shiftKey || ev.altKey) return;

      ev.preventDefault();
      navigateToStackedPage(href);
    },
    [navigateToStackedPage, href, onClick]
  );

  const onMouseEnterHandler = useCallback(
    (ev) => {
      prefetchNote(href);
      clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => highlightStackedPage(href, true), 80);
      if (onMouseEnter) onMouseEnter(ev);
    },
    [href, onMouseEnter, highlightStackedPage]
  );

  const onMouseLeaveHandler = useCallback(
    (ev) => {
      clearTimeout(highlightTimer.current);
      highlightStackedPage(href, false);
      if (onMouseLeave) onMouseLeave(ev);
    },
    [href, onMouseLeave, highlightStackedPage]
  );

  const onFocusHandler = useCallback(
    (ev) => {
      prefetchNote(href);
      if (onFocus) onFocus(ev);
    },
    [href, onFocus]
  );

  return (
    <a
      {...restProps}
      href={href}
      ref={ref}
      onClick={onClickHandler}
      onMouseEnter={onMouseEnterHandler}
      onMouseLeave={onMouseLeaveHandler}
      onFocus={onFocusHandler}
    />
  );
});
