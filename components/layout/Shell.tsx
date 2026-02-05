import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface ShellProps {
    children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
    return (
        <div className="relative flex min-h-screen flex-col bg-brand-slate">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-brand-emerald/5 blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-brand-blue/5 blur-[120px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-brand-violet/5 blur-[120px]" />
            </div>

            <Header />
            <main className="relative z-10 flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}
