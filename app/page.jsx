import { notFound } from 'next/navigation';
import { getNote, ROOT_NOTE } from '../lib/build-notes.mjs';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL, PUBLISHER } from '../lib/site';
import BrainNoteContainer from '../components/BrainNoteContainer';

export const metadata = {
  alternates: { canonical: '/' },
};

// The root note ('about') is served at '/', mirroring gatsby-theme-andy's rootNote.
export default function HomePage() {
  const note = getNote(ROOT_NOTE);
  if (!note) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    inLanguage: 'th',
    publisher: PUBLISHER,
    ...(note.mtime ? { dateModified: note.mtime } : {}),
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.note-title'] },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BrainNoteContainer slug={ROOT_NOTE} note={note} siteMetadata={{ title: SITE_TITLE }} />
    </>
  );
}
