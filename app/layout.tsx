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
    <html lang="vi">
      <body
        style={{
          minHeight: '100dvh',
          background: 'var(--bg-grouped)',
          color: 'var(--label)',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {children}
      </body>
    </html>
  );
}
