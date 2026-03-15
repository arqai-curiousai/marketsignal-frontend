import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { Shell } from '@/components/layout/Shell';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';

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
        <html lang="en" className="dark">
            <body className={`${inter.className} ${sora.variable}`}>
                <AuthProvider>
                    <Shell>{children}</Shell>
                </AuthProvider>
                <Toaster position="top-right" />
            </body>
        </html>
    );
}
