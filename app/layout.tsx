import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MoneySmartflow - Quản lý tài chính cá nhân',
  description: 'MoneySmartflow - Quản lý tài chính cá nhân bằng giọng nói tiếng Việt tự nhiên với AI nhận diện thông minh, báo cáo trực quan Recharts và hệ thống danh mục chuẩn.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" style={{ colorScheme: 'light' }}>
      <body
        style={{
          minHeight: '100dvh',
          backgroundColor: '#F2F2F7',  /* hardcoded — no CSS var, no dark mode override */
          color: '#1C1C1E',
          WebkitFontSmoothing: 'antialiased' as any,
          MozOsxFontSmoothing: 'grayscale' as any,
        }}
      >
        {children}
      </body>
    </html>
  );
}
