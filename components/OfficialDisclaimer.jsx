/** @jsxImportSource theme-ui */
'use client';

import { Box } from 'theme-ui';
import { Themed } from '../theme/themed';

export default function OfficialDisclaimer({ isHighlight, pdf, mainPdfLink }) {
  if (isHighlight) {
    return (
      <Box
        sx={{
          mt: 4,
          mb: 3,
          p: 3,
          bg: 'accent',
          borderLeft: '4px solid',
          borderColor: 'primary',
          borderRadius: 2,
          fontSize: 1,
          color: 'text',
        }}
      >
        {pdf && (
          <Themed.p sx={{ mt: 0 }}>
            หากท่านต้องการเอกสาร พ.ร.บ. นี้อย่างเป็นทางการ กรุณาใช้{' '}
            {mainPdfLink ? (
              <Themed.a href={mainPdfLink} target="_blank" rel="noopener noreferrer">
                ไฟล์ pdf จาก website สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล
              </Themed.a>
            ) : (
              'ไฟล์ pdf จาก website สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล'
            )}
            {' '}
            (
            <Themed.a href={pdf} download>
              สำรอง
            </Themed.a>
            )
          </Themed.p>
        )}
        <Themed.p sx={{ mb: 0 }}>
          Website นี้พัฒนาขึ้นแบบ open source ท่านสามารถร่วมแก้ไข ปรับปรุงได้ บน{' '}
          <Themed.a href="https://github.com/sidataplus/pdpa">GitHub</Themed.a>
        </Themed.p>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mt: 4,
        mb: 3,
        p: 3,
        bg: 'accent',
        borderLeft: '4px solid',
        borderColor: 'primary',
        borderRadius: 2,
        fontSize: 1,
        color: 'text',
      }}
    >
      <Themed.p sx={{ mt: 0 }}>
        หากท่านต้องการเอกสาร พ.ร.บ. นี้อย่างเป็นทางการ กรุณาใช้{' '}
        <Themed.a href="http://www.ratchakitcha.soc.go.th/DATA/PDF/2562/A/069/T_0052.PDF">
          ไฟล์ pdf จาก website ราชกิจจานุเบกษา
        </Themed.a>{' '}
        (
        <Themed.a href="https://github.com/sidataplus/pdpa/raw/master/src/pdf/pdpa-2562.PDF">
          สำรอง
        </Themed.a>
        )
      </Themed.p>
      <Themed.p>
        และสามารถศึกษาข้อมูลเพิ่มเติมเกี่ยวกับ PDPA ได้ที่{' '}
        <Themed.a href="https://sites.google.com/view/pdpa-2019/pdpa-home">
          เว็บไซต์ของสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล
        </Themed.a>{' '}
        และ{' '}
        <Themed.a href="https://www.law.chula.ac.th/event/9705/">
          Thailand Data Protection Guidelines 3.0 (TDPG 3.0) ของ คณะนิติศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย
        </Themed.a>{' '}
        (
        <Themed.a href="https://github.com/sidataplus/pdpa/raw/master/src/pdf/TDPG3.0-C5-20201224.pdf">
          สำรอง
        </Themed.a>
        )
      </Themed.p>
      <Themed.p sx={{ mb: 0 }}>
        Website นี้พัฒนาขึ้นแบบ open source ท่านสามารถร่วมแก้ไข ปรับปรุงได้ บน{' '}
        <Themed.a href="https://github.com/sidataplus/pdpa">GitHub</Themed.a>
      </Themed.p>
    </Box>
  );
}
