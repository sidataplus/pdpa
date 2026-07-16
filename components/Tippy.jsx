'use client';
// Ported from gatsby-theme-andy/src/components/Tippy.js
import React from 'react';
import Tippy from '@tippyjs/react';

export default function ThemedTippy(props) {
  return <Tippy placement="right" animation="shift-away" {...props} />;
}
