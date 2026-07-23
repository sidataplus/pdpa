'use client';

import { useEffect } from 'react';
import { ThemeUIProvider, useColorMode } from 'theme-ui';
import EmotionRegistry from './EmotionRegistry';
import theme from '../theme';

// Syncs the active color mode to a class on <html> so that
// theme-ui's class-based CSS variables (html.theme-ui-dark) win
// over the bare html{} block injected during SSR.
function ColorModeSync() {
  const [colorMode] = useColorMode();
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('theme-ui-light', 'theme-ui-dark');
    html.classList.add(colorMode === 'dark' ? 'theme-ui-dark' : 'theme-ui-light');
  }, [colorMode]);
  return null;
}

export default function Providers({ children }) {
  return (
    <EmotionRegistry>
      <ThemeUIProvider theme={theme}>
        <ColorModeSync />
        {children}
      </ThemeUIProvider>
    </EmotionRegistry>
  );
}
