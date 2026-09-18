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
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
