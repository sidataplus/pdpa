/** @jsxImportSource theme-ui */
'use client';
// Renders the linkified markdown body the way gatsby-plugin-mdx + theme-ui did:
// every HTML element is mapped to its `Themed.*` equivalent (so theme.styles
// applies) and anchors are replaced by our stacked-pages-aware AnchorTag.
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Themed } from '../theme/themed';
import AnchorTag from './AnchorTag';

// Strip react-markdown's `node` prop before forwarding to a Themed element.
const themed = (Tag) =>
  function ThemedEl({ node, ...props }) {
    return <Tag {...props} />;
  };

// Map every themed HTML element that @theme-ui/mdx provides (h1..h6, p, ul,
// ol, li, blockquote, hr, em, strong, img, pre, code, table, tr, th, td, ...).
// Anything not listed (thead/tbody) falls back to react-markdown's default
// element, exactly as theme-ui's MDX styling did.
const TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote',
  'hr', 'em', 'strong', 'del', 'img', 'pre', 'code', 'table', 'tr', 'th', 'td',
];
const baseComponents = {};
for (const tag of TAGS) {
  if (Themed[tag]) baseComponents[tag] = themed(Themed[tag]);
}

/**
 * Renders Markdown content safely into React components, applying Theme UI styling.
 * It uses `rehype-raw` to support HTML inside markdown, but immediately sanitizes it
 * using `rehype-sanitize` to prevent XSS attacks.
 *
 * @param {Object} props - The component props.
 * @param {string} props.body - The raw markdown string to render.
 * @param {Object} [props.popups] - Dictionary of popup contents mapped by slug.
 * @param {boolean} [props.noPopups=false] - Whether to disable hover popovers for links.
 */
function MarkdownContent({ body, popups = {}, noPopups = false }) {
  const components = React.useMemo(() => ({
    ...baseComponents,
    a: ({ node, ...props }) => <AnchorTag {...props} popups={popups} noPopups={noPopups} />,
  }), [popups, noPopups]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={components}
    >
      {body}
    </ReactMarkdown>
  );
}

export default React.memo(MarkdownContent, (prev, next) =>
  prev.body === next.body &&
  prev.noPopups === next.noPopups &&
  prev.popups === next.popups
);
