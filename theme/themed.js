'use client';
// theme-ui v0.16 no longer re-exports `Themed` from the top-level package.
// `@theme-ui/mdx` exposes the same set of themed HTML elements
// (h1..h6, p, a, ul, ol, li, blockquote, hr, em, strong, img, pre, code,
//  table, tr, th, td, ...), each applying theme.styles[tag].
import { Themed } from '@theme-ui/mdx';

export { Themed };
