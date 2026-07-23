/**
 * Shared site metadata (mirrors gatsby-config.js siteMetadata.title).
 * Used throughout the app to consistently render the main title.
 */
export const SITE_TITLE =
  'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ Thailand PDPA - SiData+ คณะแพทยศาสตร์ศิริราชพยาบาล';

export const SITE_SHORT_TITLE = 'Thailand PDPA';

export const SITE_URL = 'https://pdpa.sidata.plus';

export const SITE_DESCRIPTION =
  'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (Thailand PDPA) ฉบับเต็มทุกมาตรา พร้อมระบบค้นหาและอ้างอิงข้ามมาตราแบบสะดวก จัดทำโดยศูนย์นวัตกรรมข้อมูลศิริราช (SiData+) คณะแพทยศาสตร์ศิริราชพยาบาล มหาวิทยาลัยมหิดล';

// Publisher/Organization entity reused across JSON-LD blocks (trust signal for AEO/YMYL content).
export const PUBLISHER = {
  '@type': 'Organization',
  name: 'ศูนย์นวัตกรรมข้อมูลศิริราช (SiData+)',
  url: 'https://si.mahidol.ac.th/data',
  parentOrganization: {
    '@type': 'CollegeOrUniversity',
    name: 'คณะแพทยศาสตร์ศิริราชพยาบาล มหาวิทยาลัยมหิดล',
  },
};

/**
 * JSON.stringify for embedding in a <script type="application/ld+json">.
 * Escapes '<' so a field containing e.g. "</script>" can't break out of the
 * script tag and get parsed as HTML.
 */
export function jsonLdString(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
