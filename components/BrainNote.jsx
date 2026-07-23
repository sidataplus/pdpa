/** @jsxImportSource theme-ui */
'use client';
// Port of the project's shadowed gatsby-theme-andy BrainNote
// (src/gatsby-theme-andy/components/BrainNote.js), including the reference-note
// branch.
import React, { useMemo } from 'react';
import { Themed } from '../theme/themed';
import useWindowWidth from './useWindowWidth';
import MarkdownContent from './MarkdownContent';
import Popover from './Popover';
import Footer from './Footer';
import OfficialDisclaimer from './OfficialDisclaimer';
import TableOfContents from './TableOfContents';
import { MOBILE_BREAKPOINT } from '../lib/constants';

/**
 * Renders a single note as either a legal reference (markdown content / PDF) or a
 * regular markdown note with hover popovers for outbound wiki-links.
 *
 * @param {Object} props
 * @param {Object} props.note - Note data from build-notes.mjs. Shape:
 *   - slug {string}
 *   - title {string}
 *   - isReference {boolean} - true for supplementary legal references
 *   - body {string}         - linkified markdown (regular notes only)
 *   - content {string}      - raw markdown content (reference notes only)
 *   - pdf {string}          - local PDF path (reference notes only)
 *   - main_pdf_link {string}- official PDF URL (reference notes only)
 *   - outboundReferenceNotes {Array} - notes this note links to
 *   - inboundReferenceNotes  {Array} - notes that link to this note
 */
function BrainNote({ note }) {
  const [width] = useWindowWidth();
  const noPopups = width < MOBILE_BREAKPOINT;

  // Build hover popovers for resolved outbound wiki-links that have an excerpt.
  // Memoised so the <Popover> elements are not recreated on every render.
  const popups = useMemo(() => {
    const acc = {};
    (note.outboundReferenceNotes || [])
      .filter((ref) => !!ref.excerpt)
      .forEach((ln) => {
        acc[ln.slug] = <Popover reference={ln} />;
      });
    return acc;
  }, [note.outboundReferenceNotes]);

  if (note.isLoading) {
    return (
      <div sx={{ flex: '1' }}>
        <Themed.h1 className="note-title" sx={{ my: 3 }}>{note.title}</Themed.h1>
      </div>
    );
  }

  // Reference notes use the same markdown renderer as regular notes so copy/paste
  // carries semantic HTML paragraphs instead of CSS-only whitespace formatting.
  if (note.isReference) {
    return (
      <>
        <div sx={{ flex: '1' }}>
          <Themed.h1 className="note-title" sx={{ my: 3 }}>{note.title}</Themed.h1>
          {note.content && (
            <MarkdownContent body={note.content} popups={popups} noPopups={noPopups} />
          )}
        </div>
        <OfficialDisclaimer isReference={true} pdf={note.pdf} mainPdfLink={note.main_pdf_link} />
        <Footer references={note.inboundReferenceNotes || []} />
      </>
    );
  }

  // For the about page, split markdown at the first '---' so we can inject
  // TableOfContents between the intro blockquote and the law content.
  if (note.slug === 'about') {
    const hrIndex = note.body.search(/\r?\n---\r?\n/);
    const introPart = hrIndex >= 0 ? note.body.slice(0, hrIndex) : note.body;
    const restPart = hrIndex >= 0 ? note.body.slice(hrIndex) : '';
    return (
      <>
        <div sx={{ flex: '1' }}>
          <Themed.h1 className="note-title" sx={{ my: 3 }}>{note.title}</Themed.h1>
          <MarkdownContent body={introPart} popups={popups} noPopups={noPopups} />
          <Themed.hr />
          <TableOfContents />
          {restPart && <MarkdownContent body={restPart} popups={popups} noPopups={noPopups} />}
        </div>
        <OfficialDisclaimer />
        <Footer references={note.inboundReferenceNotes || []} />
      </>
    );
  }

  return (
    <>
      <div sx={{ flex: '1' }}>
        <Themed.h1 className="note-title" sx={{ my: 3 }}>{note.title}</Themed.h1>
        <MarkdownContent body={note.body} popups={popups} noPopups={noPopups} />
      </div>
      <Footer references={note.inboundReferenceNotes || []} />
    </>
  );
}

export default React.memo(BrainNote);
