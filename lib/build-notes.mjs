// Replicates the data layer of @aengusm/gatsby-theme-brain (via gatsby-theme-andy)
// plus this project's custom HighlightNote nodes (content/highlights-data.json).
//
// Output: a Map of slug -> note, where a note is the shape consumed by <BrainNote>.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import generateSlug from './generate-slug.mjs';
import insertLinks from './insert-links.mjs';
import makeExcerpt from './excerpt.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// lib/ -> content/
const CONTENT_DIR = path.resolve(__dirname, '..', 'content');
const NOTE_EXTENSIONS = ['.md', '.mdx'];
const ROOT_PATH = '/'; // matches gatsby-theme-andy rootPath

// Pulls out legal definitions verbatim from paragraphs shaped like
// `“term” หมายความว่า definition text...` (e.g. มาตรา ๖). Used for
// DefinedTerm structured data — text is quoted from the source, never rewritten.
function extractDefinedTerms(rawContent) {
  const terms = [];
  const paragraphRe = /[“"]([^”"]{1,50})[”"]\s*หมายความว่า\s*([^\n]+)/g;
  let match;
  while ((match = paragraphRe.exec(rawContent)) !== null) {
    const term = match[1].trim();
    const description = match[2].replace(/\s+/g, ' ').trim();
    if (term && description) terms.push({ term, description });
  }
  return terms;
}

let cache = null;
let cacheTime = 0;
// In development, cache results for 5 s so rapid file-watch triggers don't
// rebuild the full graph on every Next.js page request.
const DEV_CACHE_TTL_MS = 5000;

export function buildAll() {
  const now = Date.now();
  const isDev = process.env.NODE_ENV === 'development';
  if (cache && (!isDev || now - cacheTime < DEV_CACHE_TTL_MS)) return cache;

  const filenames = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => NOTE_EXTENSIONS.includes(path.extname(f).toLowerCase()));

  // --- Pass 1: parse every markdown note, build the name -> slug map ---
  const slugToNote = {}; // slug -> { title, content, aliases, outboundTexts }
  const nameToSlugMap = {}; // lowercased name/title/alias -> slug

  for (const filename of filenames) {
    const slug = generateSlug(path.parse(filename).name);
    const filePath = path.join(CONTENT_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { content, data: frontmatter } = matter(raw);
    const mtime = fs.statSync(filePath).mtime.toISOString();

    let title = slug;
    nameToSlugMap[slug] = slug;
    if (frontmatter.title != null) {
      title = frontmatter.title;
      nameToSlugMap[String(frontmatter.title).toLowerCase()] = slug;
    }

    let aliases = [];
    if (Array.isArray(frontmatter.aliases)) {
      aliases = frontmatter.aliases;
      aliases.forEach((alias) => {
        nameToSlugMap[String(alias).toLowerCase()] = slug;
      });
    }

    // Outbound wiki-link targets, e.g. [[ม1]] -> "ม1"
    const matches = [...content.matchAll(/(?<=\[\[).*?(?=\]\])/g)];
    const outboundTexts = matches.map((m) => m[0]);

    slugToNote[slug] = { slug, title, content, aliases, outboundTexts, mtime };
  }

  // --- Pass 2: create stub notes for unresolved references (mirrors source-nodes.js) ---
  for (const slug in slugToNote) {
    for (const text of slugToNote[slug].outboundTexts) {
      const lower = text.toLowerCase();
      if (nameToSlugMap[lower] == null) {
        const stubSlug = generateSlug(lower);
        if (slugToNote[stubSlug] == null) {
          slugToNote[stubSlug] = {
            slug: stubSlug,
            title: stubSlug,
            content: '',
            aliases: [],
            outboundTexts: [],
            mtime: null,
          };
          nameToSlugMap[stubSlug] = stubSlug;
        }
        nameToSlugMap[lower] = stubSlug;
      }
    }
  }

  // --- Pass 3: linkify content, resolve references, build backlinks + excerpts ---
  const notes = new Map();
  const backlinkMap = {}; // targetSlug -> [sourceSlug]

  for (const slug in slugToNote) {
    const note = slugToNote[slug];
    const body = insertLinks(note.content, nameToSlugMap, ROOT_PATH, true);
    const definedTerms = extractDefinedTerms(note.content);

    const outboundSlugs = [
      ...new Set(note.outboundTexts.map((t) => nameToSlugMap[t.toLowerCase()]).filter(Boolean)),
    ];

    outboundSlugs.forEach((target) => {
      if (target === slug) return; // ignore self-references
      (backlinkMap[target] = backlinkMap[target] || []).push(slug);
    });

    notes.set(slug, {
      slug,
      title: note.title,
      isHighlight: false,
      body,
      excerpt: makeExcerpt(body),
      mtime: note.mtime,
      definedTerms,
      _outboundSlugs: outboundSlugs,
    });
  }

  // --- Highlight notes (content/highlights/*.md) ---
  const highlightsDir = path.join(CONTENT_DIR, 'highlights');
  if (fs.existsSync(highlightsDir)) {
    const highlightFiles = fs
      .readdirSync(highlightsDir)
      .filter((f) => NOTE_EXTENSIONS.includes(path.extname(f).toLowerCase()));
    for (const filename of highlightFiles) {
      const raw = fs.readFileSync(path.join(highlightsDir, filename), 'utf-8');
      const { content, data: frontmatter } = matter(raw);
      if (!frontmatter.slug || !frontmatter.title) continue;
      notes.set(frontmatter.slug, {
        slug: frontmatter.slug,
        title: frontmatter.title,
        isHighlight: true,
        pdf: frontmatter.pdf ?? null,
        main_pdf_link: frontmatter.main_pdf_link ?? null,
        content: content.trim() || null,
      });
    }
  }

  // --- Resolve reference note objects (title + excerpt) for the UI ---
  const refShape = (s) => {
    const n = notes.get(s);
    if (!n) return null;
    return { slug: n.slug, title: n.title, excerpt: n.excerpt || '' };
  };

  for (const note of notes.values()) {
    if (note.isHighlight) continue;
    note.outboundReferenceNotes = (note._outboundSlugs || [])
      .map(refShape)
      .filter(Boolean);
    const inbound = [...new Set(backlinkMap[note.slug] || [])];
    note.inboundReferenceNotes = inbound.map(refShape).filter(Boolean);
    delete note._outboundSlugs;
  }

  cacheTime = now;
  cache = { notes };
  return cache;
}

export function getNote(slug) {
  return buildAll().notes.get(slug) || null;
}

export function getAllSlugs() {
  return [...buildAll().notes.keys()];
}

export const ROOT_NOTE = 'about';
