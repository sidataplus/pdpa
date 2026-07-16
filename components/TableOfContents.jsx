/** @jsxImportSource theme-ui */
'use client';
import { useEffect, useState } from 'react';
import { Box, Flex, Text } from 'theme-ui';
import NextLink from 'next/link';
import { LinkToStacked } from './LinkToStacked';
import useWindowWidth from './useWindowWidth';
import { MOBILE_BREAKPOINT } from '../lib/constants';
import { TOC } from '../lib/toc-structure';

function articleSlug(label) {
  return `article-${label.replace('ม', '')}`;
}

function ArticleChip({ label, onMobile, isActive, onSelect }) {
  const slug = articleSlug(label);
  const chipSx = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    px: 2,
    py: '6px',
    border: '1px solid',
    borderColor: 'primary',
    borderRadius: '100px',
    fontSize: 1,
    color: isActive ? 'white' : 'primary',
    bg: isActive ? 'primary' : 'transparent',
    textDecoration: 'none',
    cursor: 'pointer',
    minHeight: '32px',
    minWidth: '44px',
    fontWeight: '500',
    ':hover': { bg: isActive ? 'primary' : 'accent', textDecoration: 'none' },
  };
  const handleClick = () => onSelect(slug);
  return onMobile ? (
    <NextLink href={`/${slug}`} sx={chipSx} onClick={handleClick}>{label}</NextLink>
  ) : (
    <LinkToStacked to={`/${slug}`} sx={chipSx} onClick={handleClick}>{label}</LinkToStacked>
  );
}

function ChipGroup({ articles, onMobile, selectedSlug, onSelect }) {
  return (
    <Flex sx={{ flexWrap: 'wrap', gap: '6px' }}>
      {articles.map((label) => (
        <ArticleChip
          key={label}
          label={label}
          onMobile={onMobile}
          isActive={selectedSlug === articleSlug(label)}
          onSelect={onSelect}
        />
      ))}
    </Flex>
  );
}

export default function TableOfContents() {
  const [width] = useWindowWidth();
  const onMobile = width < MOBILE_BREAKPOINT;
  const [openSet, setOpenSet] = useState(() => new Set(TOC.map((_, i) => i)));
  const [selectedSlug, setSelectedSlug] = useState(null);

  // Reflect the currently-open second column (e.g. the default มาตรา ๑ opened
  // on first visit, or the user's browser back/forward) as the active chip.
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search.replace(/^\?/, ''));
      const slugs = params.getAll('stackedPages');
      setSelectedSlug(slugs.length ? slugs[slugs.length - 1].replace(/^\/+/, '') : null);
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const toggle = (i) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const allArticles = (section) =>
    section.articles ?? section.sections.flatMap((s) => s.articles);

  return (
    <Box sx={{ mb: 4 }}>
      <Text as="h3" sx={{ fontSize: 2, fontWeight: 'bold', mb: 2, mt: 3, color: 'text' }}>
        สารบัญมาตรา
      </Text>
      {TOC.map((section, i) => {
        const isOpen = openSet.has(i);
        const articles = allArticles(section);
        const first = articles[0];
        const last = articles[articles.length - 1];

        return (
          <Box
            key={i}
            sx={{
              border: '1px solid',
              borderColor: 'gray',
              borderRadius: '0.8rem',
              mb: 2,
              overflow: 'hidden',
            }}
          >
            <Flex
              as="button"
              onClick={() => toggle(i)}
              sx={{
                width: '100%',
                px: 3,
                py: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
                bg: isOpen ? 'accent' : 'background',
                border: 'none',
                borderBottom: isOpen ? '1px solid' : 'none',
                borderColor: 'gray',
                cursor: 'pointer',
                textAlign: 'left',
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Text sx={{ fontSize: 1, fontWeight: 'bold', color: 'text', display: 'block' }}>
                  {section.title}
                </Text>
                <Text sx={{ fontSize: 0, color: 'text-light' }}>
                  {first}–{last}
                </Text>
              </Box>
              <Box
                sx={{
                  color: 'text-light',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Box>
            </Flex>

            {isOpen && (
              <Box sx={{ px: 3, py: 2, bg: 'background' }}>
                {section.articles ? (
                  <ChipGroup articles={section.articles} onMobile={onMobile} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
                ) : (
                  section.sections.map((sub, j) => (
                    <Box key={j} sx={{ mb: j < section.sections.length - 1 ? 3 : 0 }}>
                      <Text
                        sx={{
                          fontSize: 0,
                          fontWeight: 'bold',
                          color: 'text-light',
                          mb: '6px',
                          display: 'block',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {sub.subtitle}
                      </Text>
                      <ChipGroup articles={sub.articles} onMobile={onMobile} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
                    </Box>
                  ))
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
