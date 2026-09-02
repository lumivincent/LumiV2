import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lumiterra V2 Operations Hub',
  description: 'Lumiterra V2 本地运营工作台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
