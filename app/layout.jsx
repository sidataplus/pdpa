import './globals.css';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import { Sarabun } from 'next/font/google';
import Providers from './Providers';
import { SITE_TITLE, SITE_SHORT_TITLE, SITE_DESCRIPTION, SITE_URL, PUBLISHER } from '../lib/site';
import theme from '../theme';

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '700'],
  variable: '--font-sarabun',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s - ${SITE_TITLE}` },
  description: SITE_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.png' },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: '/favicon.png', width: 1591, height: 1591, alt: SITE_SHORT_TITLE }],
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/favicon.png'],
  },
};

export const viewport = {
  themeColor: '#ffffff',
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_TITLE,
  alternateName: SITE_SHORT_TITLE,
  url: SITE_URL,
  publisher: PUBLISHER,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

// Runs synchronously before first paint, so the correct background/text
// color (saved choice, falling back to OS prefers-color-scheme) is visible
// immediately instead of flashing light then switching. We set inline CSS
// custom properties directly rather than toggling the `theme-ui-<mode>`
// class — theme-ui's own ColorModeProvider actively removes that exact class
// on mount (its own no-flash cleanup step), which raced with our class and
// caused a second, worse flicker. Inline style vars avoid that conflict:
// theme-ui's real styles win again as soon as React commits, since inline
// declarations set on the very next paint (via Providers' ColorModeSync)
// simply overwrite these.
const darkColors = theme.colors.modes.dark;
const noFlashColorMode = `(function(){try{
  var m=localStorage.getItem('theme-ui-color-mode');
  if(!m){m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  if(m==='dark'){
    var s=document.documentElement.style;
    s.setProperty('--theme-ui-colors-background','${darkColors.background}');
    s.setProperty('--theme-ui-colors-text','${darkColors.text}');
  }
}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com https://sidata.plus; img-src 'self' data: https:;"
        />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <link rel="prefetch" href="/search-index.json" as="fetch" crossOrigin="anonymous" />
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: noFlashColorMode }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={sarabun.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
