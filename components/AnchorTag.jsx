/** @jsxImportSource theme-ui */
'use client';
// Port of gatsby-theme-andy/src/components/MdxComponents.js (the `a` handler).
//
// Routing logic:
//   - External links  → plain <a> with rel="noopener noreferrer" (prevents tabnabbing)
//   - Internal + mobile (noPopups=true) → next/link (full page navigation)
//   - Internal + desktop → Tippy popover preview + LinkToStacked (pushes onto the column stack)
import NextLink from 'next/link';
import { LinkToStacked } from './LinkToStacked';
import Tippy from './Tippy';

/**
 * Universal anchor component used by MarkdownContent.
 *
 * @param {Object}  props
 * @param {string}  props.href      - Link target URL (absolute or relative).
 * @param {Object}  props.node      - Raw hast node from react-markdown (unused directly).
 * @param {Object}  props.popups    - Map of slug → <Popover> element for hover previews.
 * @param {boolean} props.noPopups  - When true (mobile), skip Tippy and use plain next/link.
 * @param {React.ReactNode} props.children
 */
export default function AnchorTag({ href, node, popups = {}, noPopups = false, children, ...restProps }) {
  if (!href) href = restProps.to;

  // Internal link (no protocol prefix)
  if (href && !href.match(/^http/)) {
    if (noPopups) {
      return (
        <NextLink {...restProps} href={href} sx={{ variant: 'links.internal' }}>
          {children}
        </NextLink>
      );
    }
    return (
      <Tippy content={popups[href.replace(/^\//, '')]} placement="right" animation="shift-away">
        <LinkToStacked {...restProps} to={href} sx={{ variant: 'links.internal' }}>
          {children}
        </LinkToStacked>
      </Tippy>
    );
  }

  // External link — rel prevents the target page from accessing window.opener (tabnabbing)
  return (
    <a
      {...restProps}
      href={href}
      rel="noopener noreferrer"
      sx={{ color: 'links', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
    >
      {children}
    </a>
  );
}
