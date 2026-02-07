'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Activity, MessageSquare, Library, Settings, Shield, LogOut, User } from 'lucide-react';
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

const navItems = [
    { name: 'Signals', href: '/stocks', icon: Activity, protected: true },
    { name: 'Assistant', href: '/assistant', icon: MessageSquare, protected: true },
    { name: 'Research', href: '/research', icon: Library, protected: true },
    { name: 'Account', href: '/settings', icon: Settings, protected: true },
];

export function Header() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand-slate/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-emerald via-brand-blue to-brand-violet p-1.5">
                            <Activity className="h-full w-full text-white" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-xl font-bold tracking-tight gradient-text">अर्थसारथी</span>
                            <span className="text-[10px] text-muted-foreground tracking-wide">powered by arQai</span>
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
