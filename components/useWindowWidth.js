'use client';
// Ported from gatsby-theme-andy/src/utils/useWindowWidth.js
import React from 'react';
import throttle from 'lodash.throttle';
import { SCROLL_THROTTLE_MS } from '../lib/constants';

export default function useWindowWidth() {
  // Start undefined so the first client render matches the server render
  // (no hydration mismatch); the real width is measured after mount.
  const [width, setWidth] = React.useState(undefined);

  React.useEffect(() => {
    const handleResize = throttle(
      () => setWidth(typeof window !== 'undefined' ? window.innerWidth : undefined),
      SCROLL_THROTTLE_MS
    );
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      handleResize.cancel();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return [width];
}
