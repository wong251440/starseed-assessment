import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://wong251440.github.io/starseed-assessment/'),
  title: '星源圖譜｜22 文明星際血脈測驗',
  description: '84 題、12 維、22 文明的多層星際血脈共振測驗。',
  openGraph: {
    title: '星源圖譜｜找回你的星際血脈',
    description: '84 題、12 維、22 文明。讀取你的文明共振星圖。',
    images: ['og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '星源圖譜｜找回你的星際血脈',
    description: '84 題、12 維、22 文明。讀取你的文明共振星圖。',
    images: ['og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
