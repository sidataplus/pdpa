/** @jsxImportSource theme-ui */
'use client';
// Port of gatsby-theme-andy/src/components/ReferredBlock.js
import NextLink from 'next/link';
import { Heading } from 'theme-ui';
import { Themed } from '../theme/themed';
import { LinkToStacked } from './LinkToStacked';
import useWindowWidth from './useWindowWidth';

export default function ReferredBlock({ references }) {
  const [width] = useWindowWidth();

  if (references.length > 0) {
    const onMobile = width < 768;

    const linkSx = {
      textDecoration: 'none',
      color: 'text-light',
      ':hover': { color: 'text' },
    };

    return (
      <>
        <Heading as="h4" color="text-light">
          ถูกอ้างอิงถึงโดย...
        </Heading>
        <div sx={{ mb: 2 }}>
          {references.map((reference) => {
            const inner = (
              <div sx={{ py: 2 }}>
                <Themed.p sx={{ fontSize: 2, m: 0, color: 'text-light' }}>{reference.title}</Themed.p>
                <Themed.p sx={{ fontSize: 1, m: 0, color: 'text-light' }}>
                  {reference.excerpt}
                </Themed.p>
              </div>
            );
            return onMobile ? (
              <NextLink sx={linkSx} href={`/${reference.slug}`} key={reference.slug}>
                {inner}
              </NextLink>
            ) : (
              <LinkToStacked sx={linkSx} to={`/${reference.slug}`} key={reference.slug}>
                {inner}
              </LinkToStacked>
            );
          })}
        </div>
        <hr sx={{ mx: 'auto', width: 64 }} />
      </>
    );
  }
  return null;
}
