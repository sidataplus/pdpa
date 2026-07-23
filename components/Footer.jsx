/** @jsxImportSource theme-ui */
'use client';
// Port of gatsby-theme-andy/src/components/Footer.js
import { Box } from 'theme-ui';
import { Themed } from '../theme/themed';
import ReferredBlock from './ReferredBlock';

const getLastUpdatedText = () => {
  const now = new Date();
  const month = new Intl.DateTimeFormat('th-TH', { month: 'long' }).format(now);
  const year = new Intl.DateTimeFormat('th-TH', { year: 'numeric' }).format(now);
  return `อัพเดทข้อมูลล่าสุด เดือน${month} ${year}`;
};

export default function Footer({ references }) {
  return (
    <Box p={3} sx={{ borderRadius: 2 }} mb={2} bg="accent" color="text-light">
      <ReferredBlock references={references} />
      <p sx={{ m: 0, fontSize: 1 }}>
        หากพบข้อผิดพลาด หรือต้องการเสนอแนะ กรุณาติดต่อศูนย์{' '}
        <Themed.a
          sx={{ textDecoration: 'underline', color: 'text-light' }}
          href="https://si.mahidol.ac.th/data/contact"
        >
          SiData+
        </Themed.a>{' '}
        หรือ{' '}
        <Themed.a
          sx={{ textDecoration: 'underline', color: 'text-light' }}
          href="https://github.com/sidataplus/pdpa"
        >
          GitHub
        </Themed.a>{' '}
        นี้
      </p>
      <p sx={{ m: 0, mt: 2, fontSize: 0, opacity: 0.7 }}>
        {getLastUpdatedText()}
      </p>
    </Box>
  );
}
