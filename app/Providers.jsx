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
    // Clear the pre-hydration no-flash inline overrides (see layout.jsx) now
    // that theme-ui's real, colorMode-driven CSS vars have taken over —
    // otherwise these inline styles would permanently win over any later
    // switch back to light.
    html.style.removeProperty('--theme-ui-colors-background');
    html.style.removeProperty('--theme-ui-colors-text');
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
