import { notFound } from 'next/navigation';
import { getNote, getAllSlugs, ROOT_NOTE } from '../../lib/build-notes.mjs';
import { SITE_TITLE, SITE_URL, PUBLISHER } from '../../lib/site';
import BrainNoteContainer from '../../components/BrainNoteContainer';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const note = getNote(params.slug);
  if (!note) return { title: SITE_TITLE };
  const description = note.excerpt || SITE_TITLE;
  // The root note is also reachable at its own slug (/about/), but "/" is
  // canonical for it — point search engines there to avoid duplicate content.
  const url = params.slug === ROOT_NOTE ? `${SITE_URL}/` : `${SITE_URL}/${params.slug}/`;
  return {
    title: note.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: note.title,
      description,
      url,
      type: 'article',
      images: [{ url: '/favicon.png', width: 1591, height: 1591, alt: note.title }],
    },
    twitter: { card: 'summary', title: note.title, description, images: ['/favicon.png'] },
  };
}

export default function NotePage({ params }) {
  const note = getNote(params.slug);
  if (!note) notFound();

  const pageUrl = `${SITE_URL}/${params.slug}/`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': note.isHighlight ? 'WebPage' : 'Legislation',
    name: note.title,
    ...(note.excerpt ? { description: note.excerpt } : {}),
    url: pageUrl,
    inLanguage: 'th',
    isPartOf: {
      '@type': 'Legislation',
      name: SITE_TITLE,
      url: SITE_URL,
    },
    publisher: PUBLISHER,
    ...(note.mtime ? { dateModified: note.mtime } : {}),
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.note-title'] },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_TITLE, item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: note.title, item: pageUrl },
    ],
  };

  // มาตรา with legal definitions (e.g. "ข้อมูลส่วนบุคคล" หมายความว่า...) get a
  // DefinedTermSet so answer engines can surface individual term definitions.
  // Terms are extracted verbatim from the source text — never rewritten.
  const definedTermsLd =
    note.definedTerms && note.definedTerms.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'DefinedTermSet',
          name: `นิยามศัพท์ตาม${note.title}`,
          url: pageUrl,
          hasDefinedTerm: note.definedTerms.map((t) => ({
            '@type': 'DefinedTerm',
            name: t.term,
            description: t.description,
            inDefinedTermSet: pageUrl,
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {definedTermsLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermsLd) }}
        />
      )}
      <BrainNoteContainer slug={params.slug} note={note} siteMetadata={{ title: SITE_TITLE }} />
    </>
  );
}
