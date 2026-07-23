export const FIRST_ARTICLE = 1;
export const LAST_ARTICLE = 96;

function describeSection(section, index) {
  return section?.heading || `section ${index + 1}`;
}

export function validateActStructure(structure) {
  if (!Array.isArray(structure) || structure.length === 0) {
    throw new Error('Act structure must be a non-empty array');
  }

  const articleNumbers = [];

  structure.forEach((section, index) => {
    const label = describeSection(section, index);
    if (typeof section?.heading !== 'string' || !section.heading.trim()) {
      throw new Error(`Act structure ${label} must have a heading`);
    }
    if (section.headingLevel !== 2 && section.headingLevel !== 3) {
      throw new Error(`Act structure ${label} must use heading level 2 or 3`);
    }
    const hasStartArticle = section.startArticle != null;
    const hasEndArticle = section.endArticle != null;
    if (!hasStartArticle && !hasEndArticle) return;
    if (
      hasStartArticle !== hasEndArticle ||
      !Number.isInteger(section.startArticle) ||
      !Number.isInteger(section.endArticle)
    ) {
      throw new Error(`Act structure ${label} must use integer article bounds`);
    }
    if (section.startArticle > section.endArticle) {
      throw new Error(`Act structure ${label} has an invalid article range`);
    }

    for (let number = section.startArticle; number <= section.endArticle; number += 1) {
      articleNumbers.push(number);
    }
  });

  const expected = Array.from(
    { length: LAST_ARTICLE - FIRST_ARTICLE + 1 },
    (_, index) => index + FIRST_ARTICLE,
  );

  if (
    articleNumbers.length !== expected.length ||
    articleNumbers.some((number, index) => number !== expected[index])
  ) {
    throw new Error(
      `Act structure must contain articles ${FIRST_ARTICLE}-${LAST_ARTICLE} exactly once and in order`,
    );
  }

  return articleNumbers;
}

export function renderFullActArticle(note, articleNumber) {
  if (!note) throw new Error(`Missing article-${articleNumber}.md`);
  if (typeof note.title !== 'string' || !note.title.trim()) {
    throw new Error(`article-${articleNumber}.md must have a title`);
  }
  if (typeof note.content !== 'string' || !note.content.trim()) {
    throw new Error(`article-${articleNumber}.md must have content`);
  }

  const content = note.content.trim();
  if (!content.startsWith('&emsp;')) {
    throw new Error(`article-${articleNumber}.md must start with &emsp;`);
  }

  return content.replace(/^&emsp;\s*/, `&emsp; [[${note.title}]] `);
}

export function buildFullActContent({ introduction, structure, getArticle }) {
  validateActStructure(structure);
  if (typeof getArticle !== 'function') {
    throw new Error('buildFullActContent requires getArticle');
  }

  const blocks = [];
  const trimmedIntroduction = String(introduction || '').trim();
  if (trimmedIntroduction) blocks.push(trimmedIntroduction);

  for (const section of structure) {
    blocks.push(`${'#'.repeat(section.headingLevel)} ${section.heading}`);

    if (section.startArticle == null) continue;
    for (let number = section.startArticle; number <= section.endArticle; number += 1) {
      blocks.push(renderFullActArticle(getArticle(number), number));
    }
  }

  return `${blocks.join('\n\n')}\n`;
}
