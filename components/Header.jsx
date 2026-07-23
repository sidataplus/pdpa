/** @jsxImportSource theme-ui */
'use client';
// Port of gatsby-theme-andy/src/components/Header.js
import React from 'react';
import { Box, Flex, useColorMode } from 'theme-ui';
import DarkModeToggle from './DarkModeToggle';
import SearchModal from './SearchModal';

const MAHIDOL_HEADER_LOGO = {
  src: '/images/mahidol-university-logo-96x96.png',
  width: 96,
  height: 96,
};

const SIDATA_HEADER_LOGO = {
  src: '/images/sidata-logo-72x72.png',
  width: 72,
  height: 72,
};

export default function Header({ siteMetadata, navigateToStackedPage }) {
  const [colorMode] = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <header>
      <Box
        sx={{
          bg: isDark ? '#0d2545' : '#1d4f91',
          borderBottom: `3px solid ${isDark ? '#d4a520' : '#ffc726'}`,
          px: 3,
          pt: 2,
          pb: 2,
        }}
      >
        <Flex sx={{ display: ['none', 'flex'], alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Flex
            as="a"
            href="/"
            sx={{ alignItems: 'center', gap: 2, textDecoration: 'none', color: '#f6f4f7', minWidth: 0, overflow: 'hidden' }}
          >
            <Box
              as="img"
              src={MAHIDOL_HEADER_LOGO.src}
              alt="Mahidol University Logo"
              width={MAHIDOL_HEADER_LOGO.width}
              height={MAHIDOL_HEADER_LOGO.height}
              decoding="async"
              fetchPriority="high"
              sx={{ height: '32px', width: 'auto', display: 'block', flexShrink: 0 }}
            />
            <Box sx={{ bg: 'white', borderRadius: '50%', p: '3px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Box
                as="img"
                src={SIDATA_HEADER_LOGO.src}
                alt="SiData+ Logo"
                width={SIDATA_HEADER_LOGO.width}
                height={SIDATA_HEADER_LOGO.height}
                decoding="async"
                fetchPriority="high"
                sx={{ height: '24px', width: 'auto', display: 'block' }}
              />
            </Box>
            <Box sx={{ fontWeight: 'bold', fontSize: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {siteMetadata.title}
            </Box>
          </Flex>
          <Flex sx={{ alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <DarkModeToggle />
            <Box sx={{ position: 'relative' }}>
              <SearchModal navigateToStackedPage={navigateToStackedPage} />
            </Box>
          </Flex>
        </Flex>

        <Box sx={{ display: ['block', 'none'] }}>
          <Flex
            as="a"
            href="/"
            sx={{ alignItems: 'flex-start', gap: 2, textDecoration: 'none', color: '#f6f4f7', mb: 2 }}
          >
            <Box
              as="img"
              src={MAHIDOL_HEADER_LOGO.src}
              alt="Mahidol University Logo"
              width={MAHIDOL_HEADER_LOGO.width}
              height={MAHIDOL_HEADER_LOGO.height}
              decoding="async"
              fetchPriority="high"
              sx={{ height: '28px', width: 'auto', display: 'block', flexShrink: 0, mt: '2px' }}
            />
            <Box sx={{ bg: 'white', borderRadius: '50%', p: '3px', display: 'flex', alignItems: 'center', flexShrink: 0, mt: '2px' }}>
              <Box
                as="img"
                src={SIDATA_HEADER_LOGO.src}
                alt="SiData+ Logo"
                width={SIDATA_HEADER_LOGO.width}
                height={SIDATA_HEADER_LOGO.height}
                decoding="async"
                fetchPriority="high"
                sx={{ height: '20px', width: 'auto', display: 'block' }}
              />
            </Box>
            <Box sx={{ fontWeight: 'bold', fontSize: 1, lineHeight: 1.5 }}>
              {siteMetadata.title}
            </Box>
          </Flex>
          <Flex sx={{ alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
            <DarkModeToggle />
            <Box sx={{ position: 'relative' }}>
              <SearchModal navigateToStackedPage={navigateToStackedPage} />
            </Box>
          </Flex>
        </Box>
      </Box>
    </header>
  );
}
