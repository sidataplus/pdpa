/** @jsxImportSource theme-ui */
'use client';
// Port of gatsby-theme-andy/src/components/Header.js
import React from 'react';
import { Box, Flex, useColorMode } from 'theme-ui';
import DarkModeToggle from './DarkModeToggle';
import SearchModal from './SearchModal';
import { SITE_SHORT_TITLE } from '../lib/site';

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
        {/* Mobile: logo+title แถว 1, controls แถว 2
            Desktop: logo+title ซ้าย, controls ขวา แถวเดียว */}

        {/* Desktop layout — แถวเดียว */}
        <Flex sx={{ display: ['none', 'flex'], alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Flex
            as="a"
            href="/"
            sx={{ alignItems: 'center', gap: 2, textDecoration: 'none', color: '#f6f4f7', minWidth: 0, overflow: 'hidden' }}
          >
            <Box as="img" src="/Mahidol_U.png" alt="Mahidol University Logo" sx={{ height: '32px', width: 'auto', display: 'block', flexShrink: 0 }} />
            <Box sx={{ bg: 'white', borderRadius: '50%', p: '3px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Box as="img" src="/favicon.png" alt="SiData+ Logo" sx={{ height: '24px', width: 'auto', display: 'block' }} />
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

        {/* Mobile layout — 2 แถว */}
        <Box sx={{ display: ['block', 'none'] }}>
          {/* แถว 1: logo + title */}
          <Flex
            as="a"
            href="/"
            sx={{ alignItems: 'flex-start', gap: 2, textDecoration: 'none', color: '#f6f4f7', mb: 2 }}
          >
            <Box as="img" src="/Mahidol_U.png" alt="Mahidol University Logo" sx={{ height: '28px', width: 'auto', display: 'block', flexShrink: 0, mt: '2px' }} />
            <Box sx={{ bg: 'white', borderRadius: '50%', p: '3px', display: 'flex', alignItems: 'center', flexShrink: 0, mt: '2px' }}>
              <Box as="img" src="/favicon.png" alt="SiData+ Logo" sx={{ height: '20px', width: 'auto', display: 'block' }} />
            </Box>
            <Box sx={{ fontWeight: 'bold', fontSize: 1, lineHeight: 1.5 }}>
              {siteMetadata.title}
            </Box>
          </Flex>
          {/* แถว 2: controls ชิดขวา */}
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
