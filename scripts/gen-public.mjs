// Generates the static data the client fetches for stacked pages.
//   public/notes/<slug>.json   one file per note (fetched lazily by the stack)
//   public/manifest.webmanifest
//
// Static assets (public/images/*, public/pdfs/*) are checked into the repo
// directly — no copying needed.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildAll } from '../lib/build-notes.mjs';
import { buildNoteMetaEntry, compactNote } from '../lib/note-payload.mjs';
import { compactSearchEntry } from '../lib/search-index.mjs';
import { stripMarkdown } from '../lib/strip-markdown.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const notesDir = path.join(publicDir, 'notes');
const noteMetaPath = path.join(publicDir, 'note-meta.json');

// --- per-note JSON ---
fs.rmSync(notesDir, { recursive: true, force: true });
fs.mkdirSync(notesDir, { recursive: true });

const { notes } = buildAll();
let count = 0;
const searchIndex = [];
const noteMeta = {};
const articleNotes = {};

for (const [slug, note] of notes) {
  fs.writeFileSync(path.join(notesDir, `${slug}.json`), JSON.stringify(compactNote(note)));
  count++;

  noteMeta[slug] = buildNoteMetaEntry(note);
  if (/^article-\d+$/.test(slug)) {
    articleNotes[slug] = compactNote(note);
  }

  // Exclude empty stub nodes from search
  let text = note.body || note.content || '';

  // Strip markdown and HTML for clean search snippets (shared utility)
  text = stripMarkdown(text);

  if (text || note.title !== slug) {
    searchIndex.push(compactSearchEntry(slug, note, text));
  }
}
fs.writeFileSync(path.join(publicDir, 'search-index.json'), JSON.stringify(searchIndex));
fs.writeFileSync(noteMetaPath, JSON.stringify(noteMeta));
fs.writeFileSync(path.join(publicDir, 'article-notes.json'), JSON.stringify(articleNotes));
console.log(`[gen] wrote ${count} note JSON files, search-index.json, and note-meta.json`);

// --- PWA manifest ---
const manifest = {
  name: 'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ Thailand PDPA - SiData+ คณะแพทยศาสตร์ศิริราชพยาบาล',
  short_name: 'PDPA',
  start_url: '/',
  background_color: '#ffffff',
  theme_color: '#ffffff',
  display: 'minimal-ui',
  icons: [{ src: '/images/sidata-logo.png', sizes: '1591x1591', type: 'image/png' }],
};
fs.writeFileSync(path.join(publicDir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
console.log('[gen] wrote manifest.webmanifest');

