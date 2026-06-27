"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, MoreVertical, Loader2, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { useOrgStore } from '@/lib/stores/org-store';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
    role: string;
}

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
    admin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    member: 'bg-green-500/20 text-green-300 border-green-500/30',
    viewer: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export default function TeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [creating, setCreating] = useState(false);

    const [teamToRename, setTeamToRename] = useState<Team | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [renaming, setRenaming] = useState(false);

    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);

    const { currentOrgId, currentOrgName } = useOrgStore();

    useEffect(() => {
        const stored = localStorage.getItem("platform_token");
        if (!stored) { router.push("/platform/login"); return; }
        setToken(stored);
    }, [router]);

    useEffect(() => {
        if (token) fetchTeams(token);
    }, [currentOrgId, token]);

    const fetchTeams = async (authToken: string) => {
        try {
            setLoading(true);
            const data = await api.teams.list(authToken, currentOrgId ?? undefined);
            setTeams(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Failed to load teams");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!newTeamName.trim() || !token) return;
        setCreating(true);
        try {
            const team = await api.teams.create(token, newTeamName.trim(), currentOrgId ?? undefined);
            setTeams([...teams, { ...team, createdAt: new Date().toISOString() }]);
            setIsCreateOpen(false);
            setNewTeamName('');
            toast.success("Team created");
        } catch (error: any) {
            toast.error("Failed to create team", { description: error.message });
        } finally {
            setCreating(false);
        }
    };

    const handleRenameTeam = async () => {
        if (!teamToRename || !token || !renameValue.trim()) return;
        setRenaming(true);
        try {
            await api.teams.update(token, teamToRename.id, renameValue.trim());
            setTeams(teams.map(t => t.id === teamToRename.id ? { ...t, name: renameValue.trim() } : t));
            toast.success("Team renamed");
            setTeamToRename(null);
            setRenameValue('');
        } catch (error: any) {
            toast.error("Failed to rename team", { description: error.message });
        } finally {
            setRenaming(false);
        }
    };

    const handleDeleteTeam = async () => {
        if (!teamToDelete || !token || deleteConfirmName !== teamToDelete.name) return;
        setDeleting(true);
        try {
            await api.teams.delete(token, teamToDelete.id);
            setTeams(teams.filter(t => t.id !== teamToDelete.id));
            toast.success("Team deleted");
            setTeamToDelete(null);
            setDeleteConfirmName('');
        } catch (error: any) {
            toast.error("Failed to delete team", { description: error.message });
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between mb-8">
                    <Skeleton className="h-10 w-32 bg-white/10" />
                    <Skeleton className="h-10 w-32 bg-white/10" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-40 rounded-xl bg-white/10" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Teams</h1>
                    <p className="text-gray-400">{currentOrgId ? `Teams in ${currentOrgName}` : 'Your personal teams'}</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary-600 hover:bg-primary-700 text-white gap-2 shadow-lg shadow-primary-900/20 border-0">
                            <Plus className="w-4 h-4" /> New Team
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Team</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Create a team to share projects with collaborators.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="team-name" className="text-gray-300">Team Name</Label>
                            <Input
                                id="team-name"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
                                className="mt-2 bg-black/50 border-white/20 text-white focus-visible:ring-primary-500"
                                placeholder="My Team"
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateTeam} disabled={creating || !newTeamName.trim()} className="bg-primary-600 hover:bg-primary-700 text-white">
                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Team
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team, index) => (
                    <motion.div
                        key={team.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                    >
                        <Card
                            className="bg-black/40 border-white/10 text-white backdrop-blur-sm hover:border-primary-500/50 transition-colors group cursor-pointer relative"
                            onClick={() => router.push(`/platform/teams/${team.id}`)}
                        >
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center border border-white/5">
                                        <Users className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg leading-none">{team.name}</CardTitle>
                                        <CardDescription className="text-xs text-gray-500 font-mono mt-1.5">{team.id}</CardDescription>
                                    </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white -mr-2">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-neutral-900 border-white/10 text-white">
                                            {(team.role === 'owner' || team.role === 'admin') && (
                                                <DropdownMenuItem
                                                    className="focus:bg-white/10 cursor-pointer"
                                                    onClick={() => { setTeamToRename(team); setRenameValue(team.name); }}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" /> Rename
                                                </DropdownMenuItem>
                                            )}
                                            {team.role === 'owner' && (
                                                <DropdownMenuItem
                                                    className="focus:bg-white/10 cursor-pointer text-red-400 focus:text-red-400"
                                                    onClick={() => setTeamToDelete(team)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardFooter className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-xs text-gray-500">{team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'N/A'}</span>
                                <Badge className={`text-xs border ${ROLE_COLORS[team.role] ?? ROLE_COLORS.member}`}>{team.role}</Badge>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}

                {!loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={() => setIsCreateOpen(true)}
                        className="cursor-pointer"
                    >
                        <Card className="bg-white/5 border-dashed border-white/10 text-white h-full flex flex-col items-center justify-center min-h-[160px] hover:bg-white/10 hover:border-white/20 transition-all group">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                                <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-300 group-hover:text-white">New Team</h3>
                            <p className="text-sm text-gray-500 mt-1">Invite collaborators</p>
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* Rename Dialog */}
            <Dialog open={!!teamToRename} onOpenChange={(open) => { if (!open) { setTeamToRename(null); setRenameValue(''); } }}>
                <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Rename Team</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameTeam()}
                            className="bg-black/50 border-white/20 text-white focus-visible:ring-primary-500"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setTeamToRename(null); setRenameValue(''); }} className="text-gray-400 hover:text-white hover:bg-white/10">Cancel</Button>
                        <Button onClick={handleRenameTeam} disabled={!renameValue.trim() || renaming} className="bg-primary-600 hover:bg-primary-700 text-white">
                            {renaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!teamToDelete} onOpenChange={(open) => { if (!open) { setTeamToDelete(null); setDeleteConfirmName(''); } }}>
                <DialogContent className="bg-neutral-900 border-red-900/50 text-white sm:max-w-[425px] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
                    <DialogHeader className="pt-4">
                        <DialogTitle className="text-red-500">Delete Team</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            This will permanently delete <span className="text-white font-semibold">{teamToDelete?.name}</span> and remove all members. Projects will become personal.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label className="text-gray-300 text-sm">Type <span className="font-mono text-white bg-black/50 px-1 py-0.5 rounded">{teamToDelete?.name}</span> to confirm.</Label>
                        <Input
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder={teamToDelete?.name}
                            className="bg-black/50 border-red-900/30 focus-visible:ring-red-500/50 text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setTeamToDelete(null); setDeleteConfirmName(''); }} className="text-gray-400 hover:text-white hover:bg-white/10">Cancel</Button>
                        <Button
                            onClick={handleDeleteTeam}
                            disabled={deleteConfirmName !== teamToDelete?.name || deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Team
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
