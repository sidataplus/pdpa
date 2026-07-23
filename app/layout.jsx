import './globals.css';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import { Sarabun } from 'next/font/google';
import Providers from './Providers';
import {
  SITE_TITLE,
  SITE_SHORT_TITLE,
  SITE_DESCRIPTION,
  SITE_URL,
  PUBLISHER,
  jsonLdString,
} from '../lib/site';

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
  icons: { icon: '/images/sidata-favicon-32x32.png' },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: '/images/sidata-logo.png', width: 1591, height: 1591, alt: SITE_SHORT_TITLE }],
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/images/sidata-logo.png'],
  },
};

// Static metadata can't react to the in-app dark-mode toggle, and the site
// no longer follows the OS's prefers-color-scheme (see theme/index.js) - so
// this just matches the light default every first-time visitor gets.
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

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="prefetch" href="/search-index.json" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/images/mahidol-university-logo-96x96.png" as="image" type="image/png" />
        <link rel="preload" href="/images/sidata-logo-72x72.png" as="image" type="image/png" />
        {/* Self-hosted heading font - preloaded so it's ready before first paint
            instead of swapping in after headings already rendered in the
            fallback font (Sarabun). */}
        <link
          rel="preload"
          href="/fonts/DB-Lim-X-v3.2.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: jsonLdString(websiteJsonLd) }}
        />
      </head>
      <body className={sarabun.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
