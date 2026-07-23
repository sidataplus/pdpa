import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const failures = [];
let checkedReferences = 0;
let checkedJsonLdBlocks = 0;

function fail(message) {
  failures.push(message);
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function publicPathForHtml(filePath) {
  const relativePath = path.relative(outDir, filePath).replaceAll(path.sep, '/');
  if (relativePath === 'index.html') return '/';
  if (relativePath.endsWith('/index.html')) return `/${relativePath.slice(0, -'index.html'.length)}`;
  return `/${relativePath}`;
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function outputTargetExists(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  const relativePath = decoded.replace(/^\/+/, '').replaceAll('\\', '/');
  const exactPath = path.resolve(outDir, relativePath);
  if (exactPath !== outDir && !exactPath.startsWith(`${outDir}${path.sep}`)) return false;
  if (isFile(exactPath)) return true;
  if (isFile(`${exactPath}.html`)) return true;
  return isFile(path.join(exactPath, 'index.html'));
}

function checkReference(rawReference, sourcePublicPath, sourceLabel) {
  const reference = decodeHtmlAttribute(rawReference.trim());
  if (!reference || reference.startsWith('#')) return;
  if (/^(?:data|mailto|tel|javascript):/i.test(reference)) return;
  if (reference.startsWith('//')) return;

  let resolved;
  try {
    resolved = new URL(reference, `https://output.local${sourcePublicPath}`);
  } catch {
    fail(`${sourceLabel}: invalid URL ${JSON.stringify(reference)}`);
    return;
  }
  if (resolved.origin !== 'https://output.local') return;

  checkedReferences += 1;
  if (!outputTargetExists(resolved.pathname)) {
    fail(`${sourceLabel}: missing target ${reference} (resolved to ${resolved.pathname})`);
  }
}

if (!isFile(path.join(outDir, 'index.html'))) {
  console.error('[check-production] missing out/index.html; run "npm run build" first');
  process.exit(1);
}

const outputFiles = walk(outDir);
const htmlFiles = outputFiles.filter((filePath) => filePath.endsWith('.html'));
const jsonFiles = outputFiles.filter((filePath) => filePath.endsWith('.json'));
const cssFiles = outputFiles.filter((filePath) => filePath.endsWith('.css'));

for (const filePath of jsonFiles) {
  try {
    JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${path.relative(outDir, filePath)}: invalid JSON (${error.message})`);
  }
}

const manifestPath = path.join(outDir, 'manifest.webmanifest');
try {
  JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`manifest.webmanifest: invalid JSON (${error.message})`);
}

for (const filePath of htmlFiles) {
  const html = fs.readFileSync(filePath, 'utf8');
  const sourceLabel = path.relative(outDir, filePath).replaceAll(path.sep, '/');
  const sourcePublicPath = publicPathForHtml(filePath);
  const referencePattern = /\b(?:href|src)=(['"])(.*?)\1/gi;
  let match;
  while ((match = referencePattern.exec(html)) !== null) {
    checkReference(match[2], sourcePublicPath, sourceLabel);
  }

  const jsonLdPattern = /<script\b[^>]*type=(['"])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    checkedJsonLdBlocks += 1;
    try {
      JSON.parse(match[2]);
    } catch (error) {
      fail(`${sourceLabel}: invalid JSON-LD (${error.message})`);
    }
  }
}

for (const filePath of cssFiles) {
  const css = fs.readFileSync(filePath, 'utf8');
  const sourceLabel = path.relative(outDir, filePath).replaceAll(path.sep, '/');
  const sourcePublicPath = `/${sourceLabel}`;
  const urlPattern = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
  let match;
  while ((match = urlPattern.exec(css)) !== null) {
    checkReference(match[2], sourcePublicPath, sourceLabel);
  }
}

let noteMeta = {};
try {
  noteMeta = JSON.parse(fs.readFileSync(path.join(outDir, 'note-meta.json'), 'utf8'));
} catch (error) {
  fail(`note-meta.json: unable to read generated note metadata (${error.message})`);
}

const noteSlugs = Object.keys(noteMeta);
for (const slug of noteSlugs) {
  if (!isFile(path.join(outDir, slug, 'index.html'))) fail(`missing page /${slug}/`);
  if (!isFile(path.join(outDir, 'notes', `${slug}.json`))) fail(`missing note payload /notes/${slug}.json`);
}

for (let article = 1; article <= 96; article += 1) {
  if (!noteSlugs.includes(`article-${article}`)) fail(`note-meta.json: missing article-${article}`);
}

try {
  const searchIndex = JSON.parse(fs.readFileSync(path.join(outDir, 'search-index.json'), 'utf8'));
  if (!Array.isArray(searchIndex) || searchIndex.length !== noteSlugs.length) {
    fail(`search-index.json: expected ${noteSlugs.length} entries, found ${searchIndex.length ?? 'invalid data'}`);
  }
} catch (error) {
  fail(`search-index.json: unable to validate (${error.message})`);
}

try {
  const articleNotes = JSON.parse(fs.readFileSync(path.join(outDir, 'article-notes.json'), 'utf8'));
  if (Object.keys(articleNotes).length !== 96) {
    fail(`article-notes.json: expected 96 articles, found ${Object.keys(articleNotes).length}`);
  }
} catch (error) {
  fail(`article-notes.json: unable to validate (${error.message})`);
}

const contentPages = [path.join(outDir, 'index.html'), ...noteSlugs.map((slug) => path.join(outDir, slug, 'index.html'))];
for (const filePath of contentPages) {
  if (!isFile(filePath)) continue;
  const html = fs.readFileSync(filePath, 'utf8');
  const canonicalCount = (html.match(/<link\b[^>]*rel=(['"])canonical\1/gi) ?? []).length;
  if (canonicalCount !== 1) {
    fail(`${path.relative(outDir, filePath)}: expected one canonical link, found ${canonicalCount}`);
  }
}

const sitemapPath = path.join(outDir, 'sitemap.xml');
if (isFile(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const expectedSitemapEntries = noteSlugs.length;
  if (locations.length !== expectedSitemapEntries) {
    fail(`sitemap.xml: expected ${expectedSitemapEntries} URLs, found ${locations.length}`);
  }
  for (const location of locations) {
    try {
      if (!outputTargetExists(new URL(location).pathname)) fail(`sitemap.xml: missing page for ${location}`);
    } catch {
      fail(`sitemap.xml: invalid URL ${location}`);
    }
  }
} else {
  fail('missing sitemap.xml');
}

const headersPath = path.join(outDir, '_headers');
if (!isFile(headersPath)) {
  fail('missing _headers deployment configuration');
} else {
  const headers = fs.readFileSync(headersPath, 'utf8').toLowerCase();
  for (const header of [
    'content-security-policy:',
    'x-frame-options:',
    'x-content-type-options:',
    'referrer-policy:',
    'permissions-policy:',
    'strict-transport-security:',
  ]) {
    if (!headers.includes(header)) fail(`_headers: missing ${header.slice(0, -1)}`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((message) => `[check-production] ${message}`).join('\n'));
  console.error(`[check-production] failed with ${failures.length} problem(s)`);
  process.exit(1);
}

console.log(
  `[check-production] verified ${htmlFiles.length} HTML files, ${jsonFiles.length} JSON files, ` +
    `${noteSlugs.length} notes, ${checkedReferences} internal references, and ${checkedJsonLdBlocks} JSON-LD blocks`,
);
