import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ArthSarthi - Your Financial Companion',
  description: 'AI-powered financial companion for expert consultation. Get instant answers about investments, tax planning, market analysis, and financial procedures.',
  keywords: ['ArthSarthi', 'finance AI', 'financial companion', 'tax planning', 'investment advisor', 'market analysis', 'wealth management'],
  authors: [{ name: 'Finance AI Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'ArthSarthi - Your Financial Companion',
    description: 'AI-powered financial companion for expert consultation',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArthSarthi',
    description: 'AI-powered financial companion',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Security Headers - In production, these should be set at server level */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      </head>
      <body className={`${inter.variable} ${merriweather.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
