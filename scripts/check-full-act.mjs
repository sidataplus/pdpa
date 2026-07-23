import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { buildAll, ROOT_NOTE } from '../lib/build-notes.mjs';
import { buildFullActContent, FIRST_ARTICLE, LAST_ARTICLE } from '../lib/full-act.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content');
const structure = JSON.parse(fs.readFileSync(path.join(contentDir, 'act-structure.json'), 'utf8'));
const introduction = matter(fs.readFileSync(path.join(contentDir, 'about.md'), 'utf8')).content;
const articles = new Map();

for (let number = FIRST_ARTICLE; number <= LAST_ARTICLE; number += 1) {
  const articlePath = path.join(contentDir, `article-${number}.md`);
  assert.ok(fs.existsSync(articlePath), `Missing content/article-${number}.md`);
  const parsed = matter(fs.readFileSync(articlePath, 'utf8'));
  articles.set(number, { title: parsed.data.title, content: parsed.content });
}

const fullActContent = buildFullActContent({
  introduction,
  structure,
  getArticle: (number) => articles.get(number),
});

for (const [number, article] of articles) {
  const marker = `&emsp; [[${article.title}]] `;
  assert.equal(
    fullActContent.split(marker).length - 1,
    1,
    `Full act must contain one generated marker for article ${number}`,
  );
}

const rootNote = buildAll().notes.get(ROOT_NOTE);
assert.ok(rootNote, `Missing generated ${ROOT_NOTE} note`);
for (let number = FIRST_ARTICLE; number <= LAST_ARTICLE; number += 1) {
  assert.match(rootNote.body, new RegExp(`\\]\\(/article-${number}\\)`));
}

console.log(
  `[check-full-act] verified articles ${FIRST_ARTICLE}-${LAST_ARTICLE}, section structure, and generated links`,
);
