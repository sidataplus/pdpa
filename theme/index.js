// Ported verbatim from the original gatsby-theme-andy shadowed theme
// (src/gatsby-theme-andy/themes.js) so colors, spacing, type scale and
// element styles render identically under theme-ui.
const theme = {
  initialColorModeName: 'light',
  // Always default to light regardless of the OS's prefers-color-scheme —
  // the user can still toggle to dark manually within the session.
  useColorSchemeMediaQuery: false,
  // Don't persist the toggle to localStorage — every fresh visit starts
  // back at light mode instead of remembering the last choice.
  useLocalStorage: false,
  colors: {
    text: '#1c1e21',
    'text-light': '#606770',
    background: '#fff',
    primary: '#1f988b',
    links: '#1f988b',
    gray: '#dadde1',
    accent: '#f5f6f8',
    heading: '#5c7ebc',
    modes: {
      dark: {
        text: '#e8e8e8',
        'text-light': '#888888',
        background: '#1b1b1d',
        primary: '#28c6b5',
        links: '#28c6b5',
        gray: '#3a3b3c',
        accent: '#242526',
        heading: '#63b3ed',
      },
    },
  },
  breakpoints: ['640px', '768px', '1024px', '1280px'],
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  borders: [0, 1, 2, 3, 4],
  radii: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fonts: {
    body: 'var(--font-sarabun), system-ui, -apple-system, sans-serif',
    heading: "'db_lim_xmedium', var(--font-sarabun), system-ui, -apple-system, sans-serif",
    monospace: 'Menlo, monospace',
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 96],
  fontWeights: {
    body: 400,
    heading: 400,
    bold: 700,
  },
  lineHeights: {
    body: 1.65,
    heading: 1.25,
  },
  links: {
    internal: {
      color: 'links',
      textDecoration: 'none',
      px: '2px',
      mx: '-2px',
      borderRadius: 1,
      ':hover': {
        bg: 'accent',
        textDecoration: 'underline',
      },
      ':focus': {
        bg: 'accent',
      },
    },
  },
  styles: {
    root: {
      fontFamily: 'body',
      lineHeight: 'body',
      fontWeight: 'body',
    },
    h1: {
      color: 'heading',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: '45px',
    },
    h2: {
      color: 'heading',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 5,
    },
    h3: {
      color: 'heading',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 4,
    },
    h4: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 2,
    },
    h5: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 1,
    },
    h6: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 0,
    },
    p: {
      color: 'text',
    },
    a: {
      color: 'links',
      textDecoration: 'none',
      ':hover': {
        textDecoration: 'underline',
      },
    },
    pre: {
      fontFamily: 'monospace',
      overflowX: 'auto',
      code: {
        color: 'inherit',
      },
    },
    code: {
      fontFamily: 'monospace',
      fontSize: 'inherit',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
    },
    th: {
      textAlign: 'left',
      borderBottomStyle: 'solid',
    },
    td: {
      textAlign: 'left',
      borderBottomStyle: 'solid',
    },
    img: {
      maxWidth: '100%',
    },
  },
};

export default theme;
