import { getAllSlugs, ROOT_NOTE } from '../lib/build-notes.mjs';
import { SITE_URL } from '../lib/site';

export const dynamic = 'force-static';

export default function sitemap() {
  // Exclude the root note's own slug — it's served at "/" (see app/page.jsx),
  // and /about/ would otherwise be a duplicate-content entry.
  const slugs = getAllSlugs().filter((slug) => slug !== ROOT_NOTE);
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    ...slugs.map((slug) => ({
      url: `${SITE_URL}/${slug}/`,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
  ];
}
