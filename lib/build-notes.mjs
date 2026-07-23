// Replicates the data layer of @aengusm/gatsby-theme-brain (via gatsby-theme-andy)
// plus this project's supplementary legal references (content/references/*.md).
//
// Output: a Map of slug -> note, where a note is the shape consumed by <BrainNote>.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import generateSlug from './generate-slug.mjs';
import insertLinks from './insert-links.mjs';
import makeExcerpt from './excerpt.mjs';
import { buildFullActContent, LAST_ARTICLE } from './full-act.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// lib/ -> content/
const CONTENT_DIR = path.resolve(__dirname, '..', 'content');
const ACT_STRUCTURE_PATH = path.join(CONTENT_DIR, 'act-structure.json');
const NOTE_EXTENSIONS = ['.md', '.mdx'];
const ROOT_PATH = '/'; // matches gatsby-theme-andy rootPath
export const ROOT_NOTE = 'about';

// Pulls out legal definitions verbatim from paragraphs shaped like
// `"term" means definition text...` in the source law. Used for
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

    // Outbound wiki-link targets, e.g. [[alias]] -> "alias"
    const matches = [...content.matchAll(/(?<=\[\[).*?(?=\]\])/g)];
    const outboundTexts = matches.map((m) => m[0]);

    slugToNote[slug] = { slug, title, content, aliases, outboundTexts, mtime };
  }

  // The root page is assembled from the canonical per-article files. The
  // markdown file itself only owns the introduction, while the JSON file owns
  // the chapter/section hierarchy.
  const rootNote = slugToNote[ROOT_NOTE];
  if (!rootNote) throw new Error(`Missing content/${ROOT_NOTE}.md`);

  let actStructure;
  try {
    actStructure = JSON.parse(fs.readFileSync(ACT_STRUCTURE_PATH, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read content/act-structure.json: ${error.message}`);
  }

  rootNote.content = buildFullActContent({
    introduction: rootNote.content,
    structure: actStructure,
    getArticle: (number) => slugToNote[`article-${number}`],
  });
  rootNote.outboundTexts = [...rootNote.content.matchAll(/(?<=\[\[).*?(?=\]\])/g)].map(
    (match) => match[0],
  );

  const fullActMtimes = [
    rootNote.mtime,
    fs.statSync(ACT_STRUCTURE_PATH).mtime.toISOString(),
    ...Array.from(
      { length: LAST_ARTICLE },
      (_, index) => slugToNote[`article-${index + 1}`]?.mtime,
    ),
  ].filter(Boolean);
  rootNote.mtime = new Date(
    Math.max(...fullActMtimes.map((mtime) => Date.parse(mtime))),
  ).toISOString();

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

    // Wiki-link ([[...]]) targets plus any markdown-link ([label](/slug))
    // targets already written in the body (e.g. links to supplementary legal
    // references). Including both means reference links get hover popovers too, not
    // only cross-article wiki-links.
    const bodyLinkSlugs = [...body.matchAll(/\]\(\/([^)\s]+)\)/g)].map((m) => m[1]);
    const outboundSlugs = [
      ...new Set([
        ...note.outboundTexts.map((t) => nameToSlugMap[t.toLowerCase()]).filter(Boolean),
        ...bodyLinkSlugs,
      ]),
    ];

    outboundSlugs.forEach((target) => {
      if (target === slug) return; // ignore self-references
      (backlinkMap[target] = backlinkMap[target] || []).push(slug);
    });

    notes.set(slug, {
      slug,
      title: note.title,
      isReference: false,
      body,
      excerpt: makeExcerpt(body),
      mtime: note.mtime,
      definedTerms,
      _outboundSlugs: outboundSlugs,
    });
  }

  // --- Supplementary legal references (content/references/*.md) ---
  const referencesDir = path.join(CONTENT_DIR, 'references');
  if (fs.existsSync(referencesDir)) {
    const referenceFiles = fs
      .readdirSync(referencesDir)
      .filter((f) => NOTE_EXTENSIONS.includes(path.extname(f).toLowerCase()));
    for (const filename of referenceFiles) {
      const referenceSlug = generateSlug(path.parse(filename).name);
      const raw = fs.readFileSync(path.join(referencesDir, filename), 'utf-8');
      const { content, data: frontmatter } = matter(raw);
      if (!frontmatter.title) continue;
      const trimmedContent = content.trim();
      // Reference files can link to titles and aliases already registered from
      // the primary content directory. Reference-to-reference links are not
      // registered here and therefore remain plain text for now.
      const linkedContent = insertLinks(trimmedContent, nameToSlugMap, ROOT_PATH, true);
      notes.set(referenceSlug, {
        slug: referenceSlug,
        title: frontmatter.title,
        isReference: true,
        pdf: frontmatter.pdf ?? null,
        main_pdf_link: frontmatter.main_pdf_link ?? null,
        content: linkedContent || null,
        // Excerpt so hover popovers work for legal reference links too.
        excerpt: makeExcerpt(linkedContent),
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
    if (note.isReference) continue;
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
