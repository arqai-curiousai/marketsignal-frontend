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
  title: 'Legal AI Assistant - Indian Law Chatbot',
  description: 'AI-powered legal assistant for Indian law consultation. Get instant answers about cases, statutes, and legal procedures.',
  keywords: ['Indian law', 'legal AI', 'lawyer chatbot', 'legal consultation', 'Indian Penal Code', 'case law'],
  authors: [{ name: 'Legal AI Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Legal AI Assistant - Indian Law Chatbot',
    description: 'AI-powered legal assistant for Indian law consultation',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal AI Assistant',
    description: 'AI-powered Indian law consultation',
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
