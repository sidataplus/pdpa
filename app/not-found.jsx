import NextLink from 'next/link';

export const metadata = { title: 'ไม่พบหน้าที่ต้องการ', robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 1rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>ไม่พบหน้าที่ต้องการ</h1>
      <p style={{ marginBottom: '1.5rem', color: '#606770' }}>หน้านี้ไม่มีอยู่หรือถูกย้ายแล้ว</p>
      <NextLink href="/" style={{ color: '#3578e5', textDecoration: 'underline' }}>กลับหน้าหลัก</NextLink>
    </div>
  );
}
