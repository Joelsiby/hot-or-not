import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { UmamiAnalytics } from '@/components/umami-analytics';
import { cn } from '@/lib/utils';
import { getSiteUrl } from '@/lib/site-url';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'Hot or Not',
  description:
    'Pick a movie, argue for it in the Hot column or against it in the Not column. Be the best critic or fan — upvotes start at ₹20.',
  referrer: 'strict-origin-when-cross-origin',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('antialiased', fontMono.variable, 'font-sans', inter.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <UmamiAnalytics />
      </body>
    </html>
  );
}
