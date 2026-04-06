'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Database,
    Palette,
    User,
    Shield,
    Download,
    Trash2,
    Monitor,
    Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api/apiClient';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// -------------------------------------------------------------------
// Types for backend responses
// -------------------------------------------------------------------
interface SessionInfo {
    session_id: string;
    device?: string;
    ip_address?: string;
    last_active?: string;
    created_at?: string;
    is_current?: boolean;
}

export default function SettingsPage() {
    const { user, checkAuth } = useAuth();
    const router = useRouter();

    // Profile edit state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);

    // Sessions state
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    // Export state
    const [exporting, setExporting] = useState(false);

    // Delete account state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Populate profile form from user
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    // Fetch sessions
    const fetchSessions = useCallback(async () => {
        setSessionsLoading(true);
        const result = await apiClient.get<{ sessions: SessionInfo[]; count: number }>('/api/auth/sessions');
        if (result.success) {
            setSessions(result.data.sessions || []);
        }
        setSessionsLoading(false);
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Profile save
    const handleProfileSave = async () => {
        setProfileSaving(true);
        const result = await apiClient.put('/api/auth/profile', {
            first_name: firstName,
            last_name: lastName,
            phone: phone || undefined,
        });
        if (result.success) {
            toast.success('Profile updated');
            await checkAuth();
        } else {
            toast.error(result.error.detail || 'Failed to update profile');
        }
        setProfileSaving(false);
    };

    // Revoke session
    const handleRevokeSession = async (sessionId: string) => {
        setRevokingId(sessionId);
        const result = await apiClient.post(`/api/auth/sessions/${encodeURIComponent(sessionId)}/revoke`);
        if (result.success) {
            toast.success('Session revoked');
            setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        } else {
            toast.error('Failed to revoke session');
        }
        setRevokingId(null);
    };

    // Data export
    const handleDataExport = async () => {
        setExporting(true);
        const result = await apiClient.post<Record<string, unknown>>('/api/auth/data-export');
        if (result.success) {
            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meridian-data-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Data exported');
        } else {
            toast.error(result.error.detail || 'Export failed');
        }
        setExporting(false);
    };

    // Account deletion
    const handleDeleteAccount = async () => {
        setDeleting(true);
        const result = await apiClient.post('/api/auth/delete-account');
        if (result.success) {
            toast.success('Account deleted');
            router.push('/');
        } else {
            toast.error(result.error.detail || 'Account deletion failed');
        }
        setDeleting(false);
        setDeleteDialogOpen(false);
    };

    return (
        <div className="container py-12 px-6 max-w-4xl">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                <p className="text-muted-foreground">Platform configuration and preferences.</p>
            </div>

            <div className="space-y-8">
                {/* ── Profile ── */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <User className="h-5 w-5 text-brand-blue" />
                        <h2 className="text-xl font-bold text-white">Profile</h2>
                    </div>
                    <Card className="p-6 bg-white/5 border-white/10 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="first-name" className="text-muted-foreground text-xs mb-1 block">First Name</Label>
                                <Input
                                    id="first-name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div>
                                <Label htmlFor="last-name" className="text-muted-foreground text-xs mb-1 block">Last Name</Label>
                                <Input
                                    id="last-name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="phone" className="text-muted-foreground text-xs mb-1 block">Phone (optional)</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="bg-white/5 border-white/10 text-white max-w-sm"
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground text-xs mb-1 block">Email</Label>
                            <p className="text-white/60 text-sm">{user?.email ?? '—'}</p>
                        </div>
                        <div className="pt-2">
                            <Button
                                size="sm"
                                onClick={handleProfileSave}
                                disabled={profileSaving}
                            >
                                {profileSaving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </Card>
                </section>

                {/* ── Active Data Sources (read-only) ── */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Database className="h-5 w-5 text-brand-blue" />
                        <h2 className="text-xl font-bold text-white">Active Data Sources</h2>
                    </div>
                    <Card className="bg-white/5 border-white/10 divide-y divide-white/5">
                        {[
                            { name: 'Kite Connect', type: 'NSE', desc: 'NSE live quotes, historical data, F&O' },
                            { name: 'EODHD', type: 'GLOBAL', desc: 'Global exchanges (NASDAQ, NYSE, LSE, HKSE) + Forex' },
                            { name: 'Qdrant Cloud', type: 'VECTOR_STORE', desc: 'Vector embeddings for RAG search' },
                        ].map((source) => (
                            <div key={source.name} className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">{source.name}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-white/10 text-muted-foreground">
                                                {source.type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{source.desc}</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                    Active
                                </Badge>
                            </div>
                        ))}
                    </Card>
                </section>

                {/* ── Appearance ── */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Palette className="h-5 w-5 text-brand-violet" />
                        <h2 className="text-xl font-bold text-white">Appearance</h2>
                    </div>
                    <Card className="p-6 bg-white/5 border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium text-white">Dark-First Gradient Theme</span>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Signature deep slate with emerald/blue/violet accents.
                                </p>
                            </div>
                            <Badge variant="default" className="bg-brand-blue/20 text-brand-blue border-brand-blue/30">Active</Badge>
                        </div>
                    </Card>
                </section>

                {/* ── Active Sessions ── */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Monitor className="h-5 w-5 text-brand-blue" />
                        <h2 className="text-xl font-bold text-white">Active Sessions</h2>
                    </div>
                    <Card className="bg-white/5 border-white/10 divide-y divide-white/5">
                        {sessionsLoading ? (
                            <div className="p-6 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="p-6 text-muted-foreground text-sm">No active sessions found.</div>
                        ) : (
                            sessions.map((session) => (
                                <div key={session.session_id} className="p-4 flex items-center justify-between">
                                    <div className="text-sm">
                                        <div className="text-white flex items-center gap-2">
                                            {session.device || 'Unknown device'}
                                            {session.is_current && (
                                                <Badge className="bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20 text-[10px]">Current</Badge>
                                            )}
                                        </div>
                                        <div className="text-muted-foreground text-xs mt-0.5">
                                            {session.ip_address && <span>{session.ip_address}</span>}
                                            {session.last_active && <span> &middot; {new Date(session.last_active).toLocaleString()}</span>}
                                        </div>
                                    </div>
                                    {!session.is_current && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                                            onClick={() => handleRevokeSession(session.session_id)}
                                            disabled={revokingId === session.session_id}
                                        >
                                            {revokingId === session.session_id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                'Revoke'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </Card>
                </section>

                {/* ── Privacy & Data ── */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="h-5 w-5 text-brand-emerald" />
                        <h2 className="text-xl font-bold text-white">Privacy &amp; Data</h2>
                    </div>
                    <Card className="p-6 bg-white/5 border-white/10 space-y-6">
                        {/* Data Export */}
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium text-white flex items-center gap-2">
                                    <Download className="h-4 w-4" /> Export My Data
                                </span>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Download all your data as JSON (watchlist, signals, preferences).
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDataExport}
                                disabled={exporting}
                            >
                                {exporting ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                    <Download className="h-3 w-3 mr-1" />
                                )}
                                Export
                            </Button>
                        </div>

                        {/* Delete Account */}
                        <div className="border-t border-white/5 pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-medium text-red-400 flex items-center gap-2">
                                        <Trash2 className="h-4 w-4" /> Delete Account
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Permanently delete your account and all associated data. This cannot be undone.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </Card>
                </section>
            </div>

            {/* Delete Account Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-slate-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Delete Account</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            This will permanently delete your account, watchlist, signals, and all
                            associated data. This action cannot be reversed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="text-muted-foreground text-xs block mb-2">
                            Type <span className="text-white font-mono">DELETE</span> to confirm
                        </Label>
                        <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setDeleteConfirmText('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deleteConfirmText !== 'DELETE' || deleting}
                            onClick={handleDeleteAccount}
                        >
                            {deleting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            Delete My Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
