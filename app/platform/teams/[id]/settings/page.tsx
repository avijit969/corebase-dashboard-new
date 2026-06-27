"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function TeamSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params?.id as string;

    const [teamName, setTeamName] = useState('');
    const [newName, setNewName] = useState('');
    const [renaming, setRenaming] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("platform_token");
        if (!stored) { router.push("/platform/login"); return; }
        setToken(stored);

        api.teams.get(stored, teamId)
            .then((data) => {
                if (data.myRole !== 'owner') {
                    router.push(`/platform/teams/${teamId}`);
                    return;
                }
                setTeamName(data.name);
                setNewName(data.name);
            })
            .catch(() => router.push('/platform/teams'))
            .finally(() => setLoading(false));
    }, [teamId, router]);

    const handleRename = async () => {
        if (!token || !newName.trim() || newName.trim() === teamName) return;
        setRenaming(true);
        try {
            await api.teams.update(token, teamId, newName.trim());
            setTeamName(newName.trim());
            toast.success("Team renamed successfully");
        } catch (error: any) {
            toast.error("Failed to rename team", { description: error.message });
        } finally {
            setRenaming(false);
        }
    };

    const handleDelete = async () => {
        if (!token || deleteConfirm !== teamName) return;
        setDeleting(true);
        try {
            await api.teams.delete(token, teamId);
            toast.success("Team deleted");
            router.push('/platform/teams');
        } catch (error: any) {
            toast.error("Failed to delete team", { description: error.message });
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-3xl mx-auto space-y-6">
                <Skeleton className="h-8 w-48 bg-white/10" />
                <Skeleton className="h-40 w-full bg-white/10 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-3xl mx-auto min-h-full">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/platform/teams/${teamId}`)} className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold text-white">Team Settings</h1>
            </div>

            <div className="space-y-6">
                {/* General */}
                <Card className="bg-neutral-900/50 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                            General
                        </CardTitle>
                        <CardDescription className="text-gray-400">Basic team settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="team-name" className="text-gray-300">Team Name</Label>
                            <div className="flex gap-3">
                                <Input
                                    id="team-name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary-500 flex-1"
                                />
                                <Button
                                    onClick={handleRename}
                                    disabled={renaming || !newName.trim() || newName.trim() === teamName}
                                    className="bg-primary-600 hover:bg-primary-700 text-white shrink-0"
                                >
                                    {renaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-neutral-900/50 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-gray-400" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription className="text-gray-400">Irreversible and destructive actions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 space-y-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-red-300/70">
                                    Deleting this team is irreversible. All members will be removed and shared projects will revert to personal ownership.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300 text-sm">
                                    Type <span className="font-mono text-white bg-black/50 px-1 py-0.5 rounded">{teamName}</span> to confirm deletion.
                                </Label>
                                <Input
                                    value={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                    placeholder={teamName}
                                    className="bg-black/50 border-red-900/30 focus-visible:ring-red-500/50 text-white"
                                />
                            </div>
                            <Button
                                onClick={handleDelete}
                                disabled={deleteConfirm !== teamName || deleting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete Team
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
