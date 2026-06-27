"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useOrgStore } from '@/lib/stores/org-store';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrgSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const orgId = params.id as string;
    const { currentOrgId, clearOrg } = useOrgStore();

    const [orgName, setOrgName] = useState('');
    const [orgSlug, setOrgSlug] = useState('');
    const [myRole, setMyRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("platform_token");
        if (!stored) { router.push("/platform/login"); return; }
        setToken(stored);

        api.orgs.get(stored, orgId).then((data) => {
            if (data.myRole !== 'owner' && data.myRole !== 'admin') {
                router.push(`/platform/organizations/${orgId}`);
                return;
            }
            setOrgName(data.name);
            setOrgSlug(data.slug);
            setMyRole(data.myRole);
        }).catch(() => {
            router.push('/platform/organizations');
        }).finally(() => setLoading(false));
    }, [orgId, router]);

    const handleSave = async () => {
        if (!token || !orgName.trim()) return;
        setSaving(true);
        try {
            await api.orgs.update(token, orgId, { name: orgName.trim(), slug: orgSlug.trim() || undefined });
            toast.success("Organization updated");
        } catch (error: any) {
            toast.error("Failed to update organization", { description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!token || deleteConfirmName !== orgName) return;
        setDeleting(true);
        try {
            await api.orgs.delete(token, orgId);
            if (currentOrgId === orgId) clearOrg();
            toast.success("Organization deleted");
            router.push('/platform/organizations');
        } catch (error: any) {
            toast.error("Failed to delete organization", { description: error.message });
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-2xl mx-auto space-y-6">
                <Skeleton className="h-10 w-48 bg-white/10" />
                <Skeleton className="h-48 w-full bg-white/10" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto min-h-full space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/platform/organizations/${orgId}`)} className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold text-white">Organization Settings</h1>
            </div>

            {/* General */}
            <Card className="bg-black/40 border-white/10 text-white">
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription className="text-gray-500">Update your organization name and slug.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-gray-300">Organization Name</Label>
                        <Input
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="bg-black/50 border-white/20 text-white focus-visible:ring-primary-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-gray-300">Slug</Label>
                        <Input
                            value={orgSlug}
                            onChange={(e) => setOrgSlug(e.target.value)}
                            className="bg-black/50 border-white/20 text-white focus-visible:ring-primary-500 font-mono"
                        />
                        <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only.</p>
                    </div>
                </CardContent>
                <CardFooter className="border-t border-white/10 pt-4">
                    <Button onClick={handleSave} disabled={!orgName.trim() || saving} className="bg-primary-600 hover:bg-primary-700 text-white">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            {/* Danger Zone */}
            {myRole === 'owner' && (
                <Card className="bg-black/40 border-red-900/30 text-white">
                    <CardHeader>
                        <CardTitle className="text-red-400">Danger Zone</CardTitle>
                        <CardDescription className="text-gray-500">Irreversible and destructive actions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border border-red-900/30 rounded-lg">
                            <div>
                                <p className="font-medium text-white">Delete this organization</p>
                                <p className="text-sm text-gray-500 mt-0.5">This will delete all teams and remove member access.</p>
                            </div>
                            <Button
                                variant="outline"
                                className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 hover:border-red-500/50"
                                onClick={() => setIsDeleteOpen(true)}
                            >
                                Delete Organization
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isDeleteOpen} onOpenChange={(open) => { if (!open) { setIsDeleteOpen(false); setDeleteConfirmName(''); } }}>
                <DialogContent className="bg-neutral-900 border-red-900/50 text-white sm:max-w-[425px] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
                    <DialogHeader className="pt-4">
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="w-5 h-5" /> Delete Organization
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            This action cannot be undone. This will permanently delete <span className="text-white font-semibold">{orgName}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <Label className="text-sm font-medium text-gray-300">
                            Type <span className="text-white font-mono bg-black/50 px-1 py-0.5 rounded">{orgName}</span> to confirm.
                        </Label>
                        <Input
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder={orgName}
                            className="bg-black/50 border-red-900/30 focus-visible:ring-red-500/50 text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setIsDeleteOpen(false); setDeleteConfirmName(''); }} className="text-gray-400 hover:text-white hover:bg-white/10">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={deleteConfirmName !== orgName || deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Organization
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
