/** @jsx jsx */
import React from 'react'; // eslint-disable-line no-unused-vars
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
          href="https://sidata.plus/about/contact.html"
        >
          SiData+
        </Styled.a>{' '}
        หรือ{' '}
        <Styled.a
          sx={{ textDecoration: 'underline', color: 'text-light' }}
          href="https://github.com/sidataplus/pdpa"
        >
          GitHub
        </Styled.a>{' '}
        นี้
      </p>
    </Box>
  );
};

export default Footer;
