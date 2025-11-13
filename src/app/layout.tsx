import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { CSP_HEADERS } from '@/lib/security/xss';
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
  title: 'Finance AI Assistant - Financial Advisory Chatbot',
  description: 'AI-powered finance assistant for financial consultation. Get instant answers about investments, financial planning, market analysis, and financial procedures.',
  keywords: ['finance AI', 'financial advisor', 'investment chatbot', 'financial consultation', 'financial planning', 'market analysis', 'wealth management'],
  authors: [{ name: 'Finance AI Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Finance AI Assistant - Financial Advisory Chatbot',
    description: 'AI-powered finance assistant for financial consultation',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Finance AI Assistant',
    description: 'AI-powered financial consultation',
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
