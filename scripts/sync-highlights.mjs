/**
 * sync-highlights.mjs
 *
 * Reads "data/โยงประกาศ PDPA.xlsx" and updates the frontmatter (title, main_pdf_link)
 * of existing highlight markdown files in "content/highlights/".
 *
 * Usage:  npm run sync
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import matter from 'gray-matter';

// ── paths ──────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const XLSX_PATH = path.join(ROOT, 'data', 'โยงประกาศ PDPA.xlsx');
const HIGHLIGHTS_DIR = path.join(ROOT, 'content', 'highlights');

// ── helpers ────────────────────────────────────────────────────────────

/**
 * Convert an Excel "มาตรา" reference into the slug used by highlight files.
 *
 * Examples:
 *   "4"          → "highlight-article-4"
 *   "24(1)"      → "highlight-article-24-1"
 *   "26(5)(ก)"   → "highlight-article-26-5"
 *   "26 last"    → "highlight-article-26-last"
 *   "38(1) ฉ.2"  → "highlight-article-38-1-2"  (if such a pattern exists)
 *   "38(1)-1"    → "highlight-article-38-1-1"
 *   "40(3)"      → "highlight-article-40-3"
 */
function articleRefToSlug(ref) {
  if (!ref) return null;

  let s = String(ref).trim();

  // Replace Thai sub-section markers like "ฉ.2" → "-2", "ฉบับที่ 2" → "-2"
  s = s.replace(/ฉ(?:บับที่)?\s*(\d+)/g, '-$1');

  // Replace "(n)" with "-n"  e.g. "24(1)" → "24-1"
  s = s.replace(/\((\d+)\)/g, '-$1');

  // Remove any remaining parenthesised Thai text like "(ก)" — these are sub-clause
  // labels that are NOT part of the slug
  s = s.replace(/\([^)]*\)/g, '');

  // Replace "last" / "วรรคท้าย" etc.
  s = s.replace(/วรรคท้าย/g, 'last');

  // Normalise whitespace / dashes
  s = s.replace(/\s+/g, '-');

  // Remove any chars that aren't digits, dash, or "last"
  s = s.replace(/[^0-9a-z\-]/gi, '');

  // Collapse multiple dashes
  s = s.replace(/-{2,}/g, '-').replace(/^-|-$/g, '');

  if (!s) return null;
  return `highlight-article-${s}`;
}

/**
 * Detect whether a cell value means "no announcement".
 */
function isNoAnnouncement(val) {
  if (!val) return true;
  const v = String(val).trim();
  return v === '' || v === 'ไม่มีประกาศ' || v === 'ยังไม่มีประกาศ';
}

// ── main ───────────────────────────────────────────────────────────────
function main() {
  // 1. Read Excel
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`[sync] ❌ Excel file not found: ${XLSX_PATH}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.log(`[sync] Read ${rows.length} rows from "${wb.SheetNames[0]}"`);

  // Detect column names — try common variants
  const headers = Object.keys(rows[0] || {});
  const colArticle = headers.find(h => /มาตรา/.test(h));
  const colTitle   = headers.find(h => /ชื่อประกาศ|เอกสารเชื่อมโยง|ประกาศ/.test(h));
  const colLink    = headers.find(h => /link/i.test(h));

  if (!colArticle || !colTitle || !colLink) {
    console.error(`[sync] ❌ Cannot detect columns. Found headers: ${headers.join(', ')}`);
    console.error(`[sync]    Need columns matching: มาตรา, ชื่อประกาศ, link`);
    process.exit(1);
  }

  console.log(`[sync] Columns: article="${colArticle}", title="${colTitle}", link="${colLink}"`);

  // 2. Build a map of slug → { title, link }
  const updates = new Map();

  for (const row of rows) {
    const ref = row[colArticle];
    const title = String(row[colTitle] || '').trim();
    const link = String(row[colLink] || '').trim();

    if (!ref) continue;
    if (isNoAnnouncement(title) && isNoAnnouncement(link)) continue;

    const slug = articleRefToSlug(ref);
    if (!slug) continue;

    updates.set(slug, { title, link });
  }

  console.log(`[sync] Found ${updates.size} announcement entries in Excel`);

  // 3. Update existing highlight markdown files
  let updated = 0;
  let skipped = 0;

  for (const [slug, data] of updates) {
    const mdPath = path.join(HIGHLIGHTS_DIR, `${slug}.md`);

    if (!fs.existsSync(mdPath)) {
      // Only warn — don't create files automatically
      console.log(`[sync] ⚠ No highlight file for "${slug}" — skipped`);
      skipped++;
      continue;
    }

    const raw = fs.readFileSync(mdPath, 'utf-8');
    const parsed = matter(raw);
    const fm = parsed.data;

    let changed = false;

    // Update title if Excel has one
    if (data.title && data.title !== fm.title) {
      fm.title = data.title;
      changed = true;
    }

    // Update main_pdf_link if Excel has a URL
    if (data.link && data.link !== fm.main_pdf_link) {
      fm.main_pdf_link = data.link;
      changed = true;
    }

    if (changed) {
      // Reconstruct file: frontmatter + body
      const output = matter.stringify(parsed.content, fm);
      fs.writeFileSync(mdPath, output, 'utf-8');
      console.log(`[sync] ✅ Updated ${slug}.md`);
      updated++;
    }
  }

  console.log(`[sync] Done — ${updated} file(s) updated, ${skipped} skipped`);
}

main();
