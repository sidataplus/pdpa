// Ported from @aengusm/gatsby-theme-brain/src/insert-links.js
// Converts [[Wiki Links]] into markdown links [text](/slug).
// We only support the double-bracket form (linkifyHashtags is off in this site)
// and hideDoubleBrackets is true, so [[ม1]] -> [ม1](/article-1).

export default function insertLinks(originalRawContent, nameToSlugMap, rootPath = '/', hideDoubleBrackets = true) {
  // Content between double brackets, excluding the brackets, e.g. [[Example]] -> Example
  const bracketRegexExclusive = /(?<=\[\[).*?(?=\]\])/g;
  // Content between double brackets, including the brackets, e.g. [[Example]] -> [[Example]]
  const bracketRegexInclusive = /\[\[.*?\]\]/g;

  return replaceBasedOnRegex(
    bracketRegexInclusive,
    bracketRegexExclusive,
    originalRawContent,
    nameToSlugMap,
    rootPath,
    hideDoubleBrackets
  );
}

function replaceBasedOnRegex(regexInclusive, regexExclusive, originalRawContent, nameToSlugMap, rootPath, replaceWithJustText) {
  let newRawContent = originalRawContent;
  let replacementMatches = originalRawContent.match(regexInclusive);

  if (replacementMatches === null) {
    return newRawContent;
  }

  replacementMatches
    .filter((a, b) => replacementMatches.indexOf(a) === b)
    .forEach((match) => {
      const justText = match.match(regexExclusive)[0];
      const name = justText.toLowerCase();
      if (name in nameToSlugMap) {
        const link = nameToSlugMap[name];
        const linkPath = rootPath + link;
        const linkified = `[${replaceWithJustText ? justText : match}](${linkPath})`;
        newRawContent = newRawContent.split(match).join(linkified);
      }
    });

  return newRawContent;
}
