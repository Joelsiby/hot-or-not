import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import { headers } from 'next/headers';

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { UmamiAnalytics } from '@/components/umami-analytics';
import { ClarityAnalytics } from '@/components/clarity-analytics';
import { CurrencyProvider } from '@/components/currency-provider';
import { detectCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { getSiteUrl } from '@/lib/site-url';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'Hate It or Love It',
  description:
    'Pick a movie, argue for it in the Love It column or against it in the Hate It column. Be the best critic or fan — upvotes start at ₹20.',
  referrer: 'strict-origin-when-cross-origin',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Vercel sets this header on every production request; absent in local
  // dev, where detectCurrency() falls back to India/INR. Detected once
  // here, server-side, and handed down via context — see
  // components/currency-provider.tsx.
  const headerList = await headers();
  const currency = detectCurrency(headerList.get('x-vercel-ip-country'));

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('antialiased', fontMono.variable, 'font-sans', inter.variable)}
    >
      <body>
        <ThemeProvider>
          <CurrencyProvider currency={currency}>{children}</CurrencyProvider>
        </ThemeProvider>
        <UmamiAnalytics />
        <ClarityAnalytics />
      </body>
    </html>
  );
}
