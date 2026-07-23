/**
 * Helpers for the generated note payload files under `public/notes`.
 *
 * Source of truth:
 *   content/*.md and content/references/*.md
 *
 * Build-time output:
 *   public/notes/<slug>.json
 *   public/note-meta.json
 *
 * The payloads are intentionally compact to keep the site fast. These helpers
 * give those short fields readable names again before the UI renders them.
 */

/**
 * Convert a full note object into the compact JSON shape written to
 * `public/notes/<slug>.json`.
 *
 * @param {Object} note
 * @returns {Object}
 */
export function compactNote(note) {
  if (note.isReference) {
    return {
      s: note.slug,
      t: note.title,
      h: 1,
      c: note.content ?? '',
      p: note.pdf ?? '',
      l: note.main_pdf_link ?? '',
    };
  }

  return {
    s: note.slug,
    t: note.title,
    b: note.body,
    o: (note.outboundReferenceNotes || []).map((ref) => ref.slug),
    i: (note.inboundReferenceNotes || []).map((ref) => ref.slug),
  };
}

/**
 * Build the small metadata lookup file used to rehydrate compact references.
 *
 * @param {Object} note
 * @returns {[string, string]}
 */
export function buildNoteMetaEntry(note) {
  return [note.title, note.excerpt || ''];
}

/**
 * Convert one compact metadata entry back into the reference shape used by the UI.
 *
 * @param {string} slug
 * @param {Object<string, [string, string]>} noteMeta
 * @returns {{slug: string, title: string, excerpt: string}}
 */
function hydrateReference(slug, noteMeta) {
  const meta = noteMeta?.[slug];
  return {
    slug,
    title: meta?.[0] || slug,
    excerpt: meta?.[1] || '',
  };
}

/**
 * Convert a compact note payload back into the readable note shape consumed by
 * the React UI.
 *
 * @param {Object|null} payload
 * @param {string} fallbackSlug
 * @param {Object<string, [string, string]>} noteMeta
 * @returns {Object|null}
 */
export function hydrateNotePayload(payload, fallbackSlug, noteMeta) {
  if (!payload) return null;

  if (payload.h) {
    return {
      slug: payload.s || fallbackSlug,
      title: payload.t,
      isReference: true,
      content: payload.c || null,
      pdf: payload.p || null,
      main_pdf_link: payload.l || null,
      outboundReferenceNotes: [],
      inboundReferenceNotes: [],
    };
  }

  return {
    slug: payload.s || fallbackSlug,
    title: payload.t,
    isReference: false,
    body: payload.b,
    outboundReferenceNotes: (payload.o || []).map((slug) => hydrateReference(slug, noteMeta)),
    inboundReferenceNotes: (payload.i || []).map((slug) => hydrateReference(slug, noteMeta)),
  };
}
