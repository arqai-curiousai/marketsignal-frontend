'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Activity,
    ArrowLeftRight,
    TestTubes,
    BrainCircuit,
    CircleUser,
    Shield,
    LogOut,
    Menu,
    Crown,
    Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ExchangeSelector } from '@/components/layout/ExchangeSelector';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip';

/* ── Protected nav items (center zone, authenticated only) ── */
const navItems = [
    { name: 'Forex', href: '/forex', icon: ArrowLeftRight },
    { name: 'Pulse', href: '/signals', icon: Activity },
    { name: 'Playground', href: '/playground', icon: TestTubes },
    { name: 'Assistant', href: '/assistant', icon: BrainCircuit },
    { name: 'Account', href: '/settings', icon: CircleUser },
];

/* ── Product landing pages (center zone, unauthenticated) ── */
const productLinks = [
    { name: 'Forex', href: '/', icon: ArrowLeftRight },
    { name: 'Pulse', href: '/pulse', icon: Activity },
    { name: 'Simulations', href: '/simulations', icon: TestTubes },
];

/* ── Public links (always visible in actions zone + mobile drawer) ── */
const publicLinks = [
    { name: 'About Us', href: '/about', icon: Users },
    { name: 'Pricing', href: '/pricing', icon: Crown },
];

export function Header() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const isLanding = pathname === '/' || pathname === '/pulse' || pathname === '/simulations';

    useEffect(() => {
        if (!isLanding) return;
        const handleScroll = () => setScrolled(window.scrollY > 80);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLanding]);

    const headerBg = isLanding && !scrolled
        ? 'bg-transparent border-transparent'
        : 'bg-brand-slate/70 backdrop-blur-xl border-white/[0.06] header-lit-edge';

    return (
        <header className={cn("sticky top-0 z-50 w-full border-b transition-all duration-500", headerBg)}>
            <div className="container flex h-14 items-center gap-4">
                {/* ── Zone A: Brand ── */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Mobile hamburger */}
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" className="md:hidden p-2 hover:bg-white/[0.06]" aria-label="Open navigation menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 bg-brand-slate border-white/[0.06] p-0">
                            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
                                <SheetHeader className="p-0">
                                    <SheetTitle className="gradient-text text-left text-lg">Market Signal</SheetTitle>
                                </SheetHeader>
                                <p className="text-[11px] text-white/30 mt-1">Investment Research Platform</p>
                            </div>

                            {/* User card in mobile */}
                            {isAuthenticated && user && (
                                <div className="px-6 py-3 border-b border-white/[0.06] flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                                        <AvatarFallback className="bg-brand-moss text-white text-xs">
                                            {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {user?.name || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User'}
                                        </p>
                                        <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
                                    </div>
                                </div>
                            )}

                            <nav className="flex flex-col gap-0.5 px-3 mt-4">
                                {/* Product landing links for unauthenticated users */}
                                {!isAuthenticated && (
                                    <>
                                        <p className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest text-white/30">Products</p>
                                        {productLinks.map((item, i) => {
                                            const Icon = item.icon;
                                            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                                            return (
                                                <motion.div
                                                    key={item.href}
                                                    initial={{ opacity: 0, x: -16 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.05 + i * 0.04, duration: 0.2 }}
                                                >
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => setMobileOpen(false)}
                                                        className={cn(
                                                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                                                            isActive
                                                                ? "bg-brand-emerald/10 text-white border-l-2 border-brand-emerald"
                                                                : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                                                        )}
                                                    >
                                                        <Icon className={cn("h-4 w-4", isActive && "text-brand-emerald")} />
                                                        {item.name}
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                        <div className="my-2 mx-4 h-px bg-white/[0.06]" />
                                    </>
                                )}

                                {/* Public links (About, Pricing) */}
                                {publicLinks.map((item, i) => {
                                    const Icon = item.icon;
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 + (isAuthenticated ? 0 : productLinks.length + 1) * 0.04 + i * 0.04, duration: 0.2 }}
                                        >
                                            <Link
                                                href={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                                                    isActive
                                                        ? "bg-brand-emerald/10 text-white border-l-2 border-brand-emerald"
                                                        : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                                                )}
                                            >
                                                <Icon className={cn("h-4 w-4", isActive && "text-brand-emerald")} />
                                                {item.name}
                                            </Link>
                                        </motion.div>
                                    );
                                })}

                                {/* Separator when authenticated */}
                                {isAuthenticated && (
                                    <div className="my-2 mx-4 h-px bg-white/[0.06]" />
                                )}

                                {/* Protected nav items */}
                                {navItems.map((item, i) => {
                                    if (!isAuthenticated) return null;
                                    const Icon = item.icon;
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, x: -16 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 + (publicLinks.length + i) * 0.04, duration: 0.2 }}
                                        >
                                            <Link
                                                href={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                                                    isActive
                                                        ? "bg-brand-emerald/10 text-white border-l-2 border-brand-emerald"
                                                        : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                                                )}
                                            >
                                                <Icon className={cn("h-4 w-4", isActive && "text-brand-emerald")} />
                                                {item.name}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </nav>

                            <div className="mt-auto px-3 py-4 border-t border-white/[0.06]">
                                <Link
                                    href="/legal"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/50 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors"
                                >
                                    <Shield className="h-4 w-4" />
                                    Legal & Compliance
                                </Link>
                                {isAuthenticated ? (
                                    <button
                                        onClick={() => { setMobileOpen(false); logout(); }}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-white/50 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors w-full"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Log out
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-emerald hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-3 group">
                        <motion.div
                            className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-brand-emerald via-brand-blue to-brand-violet p-1.5 shadow-md shadow-brand-emerald/15 group-hover:shadow-brand-emerald/30 transition-shadow duration-300"
                            whileHover={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.4 }}
                        >
                            <Activity className="h-full w-full text-white" />
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
                        </motion.div>
                        <span className="hidden sm:inline text-lg font-bold tracking-tight gradient-text">Market Signal</span>
                        <div className="hidden sm:flex items-center gap-1 border-l border-white/[0.06] pl-3">
                            <span className="text-[11px] font-semibold tracking-wider text-white/50">ar</span>
                            <span className="text-[13px] font-bold bg-gradient-to-r from-brand-blue to-brand-violet bg-clip-text text-transparent">Q</span>
                            <span className="text-[11px] font-semibold tracking-wider text-white/50">ai</span>
                        </div>
                    </Link>

                    {!isLanding && <ExchangeSelector />}
                </div>

                {/* ── Zone B: Navigation (centered) ── */}
                <nav className="hidden md:flex flex-1 items-center justify-center">
                    {(() => {
                        const items = isAuthenticated ? navItems : productLinks;
                        const isActiveCheck = (href: string) => {
                            if (!isAuthenticated) {
                                // For product links: exact match for '/', startsWith for others
                                if (href === '/') return pathname === '/';
                                return pathname.startsWith(href);
                            }
                            return pathname.startsWith(href);
                        };
                        return (
                            <div className="flex items-center gap-1">
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isActiveCheck(item.href);

                                    return (
                                        <div key={item.href} className="relative">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <motion.div
                                                        whileHover={{ y: -1 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        transition={{ duration: 0.15 }}
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            aria-current={isActive ? 'page' : undefined}
                                                            className={cn(
                                                                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-200 relative",
                                                                isActive
                                                                    ? "text-white"
                                                                    : "text-white/50 hover:text-white/80"
                                                            )}
                                                        >
                                                            <Icon className={cn("h-4 w-4", isActive ? "text-brand-emerald" : "opacity-60")} />
                                                            <span className="hidden lg:inline">{item.name}</span>
                                                        </Link>
                                                    </motion.div>
                                                </TooltipTrigger>
                                                <TooltipContent className="lg:hidden">
                                                    {item.name}
                                                </TooltipContent>
                                            </Tooltip>
                                            {/* Active underline glow */}
                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="nav-underline"
                                                        className="absolute -bottom-[7px] left-2 right-2 nav-underline-glow"
                                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </nav>

                {/* ── Zone C: Actions ── */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* About Us + Pricing — always visible (both auth states), desktop only */}
                    {publicLinks.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "hidden md:inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200",
                                pathname.startsWith(item.href)
                                    ? "text-white bg-white/[0.06]"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}

                    {/* Compliance — unauthenticated only (in dropdown for authenticated) */}
                    {!isAuthenticated && (
                        <Link
                            href="/legal"
                            className={cn(
                                "hidden md:inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200",
                                pathname.startsWith('/legal')
                                    ? "text-white bg-white/[0.06]"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                            )}
                        >
                            Compliance
                        </Link>
                    )}

                    {/* Subtle separator */}
                    <div className="hidden md:block w-px h-4 bg-white/[0.08] mx-1" />

                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="User menu">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                                        <AvatarFallback className="bg-brand-moss text-white text-xs">
                                            {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {user?.name || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User'}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/legal" className="flex items-center cursor-pointer">
                                        <Shield className="mr-2 h-4 w-4" />
                                        <span>Legal & Compliance</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link href="/login">
                            <Button size="sm" className="bg-gradient-to-r from-brand-blue to-brand-violet hover:opacity-90 transition-opacity h-8 px-4 text-xs font-semibold">
                                Login
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
