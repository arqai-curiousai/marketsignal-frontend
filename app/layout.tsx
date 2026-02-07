import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Shell } from '@/components/layout/Shell';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

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
            <body className={inter.className}>
                <AuthProvider>
                    <Shell>{children}</Shell>
                </AuthProvider>
                <Toaster position="top-right" />
            </body>
        </html>
    );
}
