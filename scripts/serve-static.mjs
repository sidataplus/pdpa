import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { SECURITY_HEADERS } from '../lib/security-headers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'out');
const args = process.argv.slice(2);

function readOption(...names) {
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const name = names.find((candidate) => argument === candidate || argument.startsWith(`${candidate}=`));
    if (!name) continue;
    return argument.includes('=') ? argument.slice(argument.indexOf('=') + 1) : args[index + 1];
  }
  return undefined;
}

const port = Number(readOption('--port', '-p') ?? process.env.PORT ?? 3000);
const host = readOption('--host', '-H') ?? process.env.HOST ?? '0.0.0.0';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('[serve-static] port must be an integer between 1 and 65535');
  process.exit(1);
}

if (!fs.existsSync(path.join(outDir, 'index.html'))) {
  console.error('[serve-static] missing out/index.html; run "npm run build" first');
  process.exit(1);
}

const mimeTypes = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function resolveRequestPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname).replaceAll('\\', '/');
  } catch {
    return { error: 400 };
  }

  const relativePath = decoded.replace(/^\/+/, '');
  const resolvedPath = path.resolve(outDir, relativePath);
  if (resolvedPath !== outDir && !resolvedPath.startsWith(`${outDir}${path.sep}`)) {
    return { error: 403 };
  }

  if (decoded.endsWith('/')) {
    const indexPath = path.join(resolvedPath, 'index.html');
    return isFile(indexPath) ? { filePath: indexPath } : { error: 404 };
  }

  if (isFile(resolvedPath)) return { filePath: resolvedPath };
  if (isDirectory(resolvedPath) && isFile(path.join(resolvedPath, 'index.html'))) {
    return { redirect: `${pathname}/` };
  }

  const htmlPath = `${resolvedPath}.html`;
  return isFile(htmlPath) ? { filePath: htmlPath } : { error: 404 };
}

function cacheControl(filePath) {
  const relativePath = path.relative(outDir, filePath).replaceAll(path.sep, '/');
  if (relativePath.endsWith('.html')) return 'no-cache';
  if (relativePath.startsWith('_next/static/')) return 'public, max-age=31536000, immutable';
  return 'public, max-age=3600';
}

function setSecurityHeaders(response) {
  for (const [name, value] of SECURITY_HEADERS) response.setHeader(name, value);
}

function writeHeaders(response, statusCode, filePath) {
  response.statusCode = statusCode;
  setSecurityHeaders(response);
  response.setHeader('Content-Type', mimeTypes.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream');
  response.setHeader('Content-Length', fs.statSync(filePath).size);
  response.setHeader('Cache-Control', cacheControl(filePath));
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    setSecurityHeaders(response);
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  const requestUrl = new URL(request.url ?? '/', 'http://localhost');
  const result = resolveRequestPath(requestUrl.pathname);

  if (result.redirect) {
    setSecurityHeaders(response);
    response.writeHead(308, { Location: `${result.redirect}${requestUrl.search}` });
    response.end();
    return;
  }

  let filePath = result.filePath;
  let statusCode = 200;
  if (!filePath) {
    statusCode = result.error ?? 404;
    filePath = path.join(outDir, '404.html');
    if (!isFile(filePath)) {
      setSecurityHeaders(response);
      response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(http.STATUS_CODES[statusCode] ?? 'Error');
      return;
    }
  }

  writeHeaders(response, statusCode, filePath);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  fs.createReadStream(filePath).pipe(response);
});

server.on('error', (error) => {
  console.error(`[serve-static] ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`[serve-static] serving ${outDir}`);
  console.log(`[serve-static] http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
