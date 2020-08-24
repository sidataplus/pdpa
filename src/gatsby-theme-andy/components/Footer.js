/** @jsx jsx */
import React from 'react';
import { Styled, jsx, Box } from 'theme-ui';

import ReferredBlock from './ReferredBlock';

const Footer = ({ references }) => {
  return (
    <Box p={3} sx={{ borderRadius: 2 }} mb={2} bg="accent" color="text-light">
      <ReferredBlock references={references} />
      <p sx={{ m: 0, fontSize: 1 }}>
        หากพบข้อผิดพลาด หรือต้องการเสนอแนะ กรุณาติดต่อศูนย์{' '}
        <Styled.a
          sx={{ textDecoration: 'underline', color: 'text-light' }}
          href="mailto:siwarehouse@mahidol.ac.th"
        >
          SiData+
        </Styled.a>
      </p>
    </Box>
  );
};

export default Footer;