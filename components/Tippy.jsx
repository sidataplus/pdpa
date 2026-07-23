'use client';
// Ported from gatsby-theme-andy/src/components/Tippy.js
import React, { cloneElement, isValidElement, useCallback, useRef } from 'react';
import Tippy from '@tippyjs/react';

export default function ThemedTippy({ children, ...props }) {
  const referenceRef = useRef(null);

  const setReference = useCallback((node) => {
    referenceRef.current = node;
  }, []);

  return (
    <>
      {isValidElement(children) ? cloneElement(children, { ref: setReference }) : children}
      <Tippy
        placement="right"
        animation="shift-away"
        touch={false}
        reference={referenceRef}
        {...props}
      />
    </>
  );
}
