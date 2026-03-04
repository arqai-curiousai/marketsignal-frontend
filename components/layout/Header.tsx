'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Activity, MessageSquare, Library, Settings, Shield, LogOut, FlaskConical, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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

const navItems = [
    { name: 'Markets', href: '/signals', icon: Activity, protected: true },
    { name: 'Playground', href: '/playground', icon: FlaskConical, protected: true },
    { name: 'Assistant', href: '/assistant', icon: MessageSquare, protected: true },
    { name: 'Research', href: '/research', icon: Library, protected: true },
    { name: 'Account', href: '/settings', icon: Settings, protected: true },
];

export function Header() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand-slate/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                    {/* Mobile hamburger menu */}
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" className="md:hidden p-2">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 bg-brand-slate border-white/10">
                            <SheetHeader>
                                <SheetTitle className="gradient-text text-left">Market Signal</SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col gap-1 mt-6">
                                {navItems.map((item) => {
                                    if (item.protected && !isAuthenticated) return null;
                                    const Icon = item.icon;
                                    const isActive = pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                                isActive
                                                    ? "bg-white/10 text-white"
                                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="mt-auto pt-6 border-t border-white/10">
                                <Link
                                    href="/legal"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <Shield className="h-4 w-4" />
                                    Compliance
                                </Link>
                                {isAuthenticated ? (
                                    <button
                                        onClick={() => { setMobileOpen(false); logout(); }}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-colors w-full"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Log out
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-blue hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Link href="/" className="flex items-center space-x-3 group">
                        {/* Animated gradient icon */}
                        <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-brand-emerald via-brand-blue to-brand-violet p-1.5 shadow-lg shadow-brand-blue/20 group-hover:shadow-brand-blue/40 transition-shadow duration-300">
                            <Activity className="h-full w-full text-white" />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                        </div>
                        {/* Market Signal text */}
                        <span className="text-xl font-bold tracking-tight gradient-text">Market Signal</span>
                        {/* Stylized arQai badge */}
                        <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                            <span className="text-[11px] font-semibold tracking-wider text-white/50">ar</span>
                            <span className="text-[13px] font-bold bg-gradient-to-r from-brand-blue to-brand-violet bg-clip-text text-transparent">Q</span>
                            <span className="text-[11px] font-semibold tracking-wider text-white/50">ai</span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => {
                            if (item.protected && !isAuthenticated) return null;

                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors",
                                        isActive
                                            ? "bg-white/10 text-white"
                                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/legal">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                            <Shield className="h-4 w-4 mr-2" />
                            Compliance
                        </Button>
                    </Link>

                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                                        <AvatarFallback>{user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.name || `${user?.firstName} ${user?.lastName}`}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logout()}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link href="/login">
                            <Button size="sm" className="bg-gradient-to-r from-brand-blue to-brand-violet hover:opacity-90 transition-opacity">
                                Login
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
