import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEV_SECURITY_HEADERS } from './lib/security-headers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devHeaders = DEV_SECURITY_HEADERS.map(([key, value]) => ({ key, value }));

/** @type {(phase: string) => import('next').NextConfig} */
export default (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    // Static export (like the original Gatsby build) for production only.
    // In dev we omit it so dynamic [slug] routes render on demand.
    ...(isDev ? {} : { output: 'export' }),
    ...(isDev
      ? {
          // Security headers (dev server only - see comment above).
          async headers() {
            return [{ source: '/(.*)', headers: devHeaders }];
          },
        }
      : {}),
    images: { unoptimized: true },
    turbopack: { root: __dirname },
    // Emit /slug/index.html so static hosts serve clean URLs.
    trailingSlash: true,
  };
};
