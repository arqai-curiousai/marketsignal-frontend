import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { Shell } from '@/components/layout/Shell';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ExchangeProvider } from '@/context/ExchangeContext';
import { ThemeProvider } from 'next-themes';

const inter = Inter({ subsets: ['latin'] });
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['300', '400', '600', '700'],
});

export const metadata: Metadata = {
    title: 'Market Signal - Investment Research & Signals by arQai',
    description: 'AI-powered investment research and signals platform by arQai. Real-time monitoring and sourced insights.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} ${sora.variable}`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange={false}
                >
                    <AuthProvider>
                        <ExchangeProvider>
                            <Shell>{children}</Shell>
                        </ExchangeProvider>
                    </AuthProvider>
                    <Toaster position="top-right" />
                </ThemeProvider>
            </body>
        </html>
    );
}
