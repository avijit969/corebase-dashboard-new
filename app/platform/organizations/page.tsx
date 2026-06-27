"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, MoreVertical, Loader2, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface Org {
    id: string;
    name: string;
    slug: string;
    role: string;
    createdAt?: string;
}

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
    admin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    member: 'bg-green-500/20 text-green-300 border-green-500/30',
};

export default function OrganizationsPage() {
    const router = useRouter();
    const { setOrg } = useOrgStore();
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [creating, setCreating] = useState(false);

    const [orgToDelete, setOrgToDelete] = useState<Org | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("platform_token");
        if (!stored) { router.push("/platform/login"); return; }
        setToken(stored);
        fetchOrgs(stored);
    }, [router]);

    const fetchOrgs = async (authToken: string) => {
        try {
            setLoading(true);
            const data = await api.orgs.list(authToken);
            setOrgs(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Failed to load organizations");
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (value: string) => {
        setNewName(value);
        setNewSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    };

    const handleCreateOrg = async () => {
        if (!newName.trim() || !newSlug.trim() || !token) return;
        setCreating(true);
        try {
            const org = await api.orgs.create(token, newName.trim(), newSlug.trim());
            setOrgs([...orgs, { ...org, createdAt: new Date().toISOString() }]);
            setIsCreateOpen(false);
            setNewName('');
            setNewSlug('');
            toast.success("Organization created");
        } catch (error: any) {
            toast.error("Failed to create organization", { description: error.message });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteOrg = async () => {
        if (!orgToDelete || !token || deleteConfirmName !== orgToDelete.name) return;
        setDeleting(true);
        try {
            await api.orgs.delete(token, orgToDelete.id);
            setOrgs(orgs.filter(o => o.id !== orgToDelete.id));
            toast.success("Organization deleted");
            setOrgToDelete(null);
            setDeleteConfirmName('');
        } catch (error: any) {
            toast.error("Failed to delete organization", { description: error.message });
        } finally {
            setDeleting(false);
        }
    };

    const handleSwitchToOrg = (org: Org) => {
        setOrg(org.id, org.name);
        router.push('/platform');
        toast.success(`Switched to ${org.name}`);
    };

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between mb-8">
                    <Skeleton className="h-10 w-48 bg-white/10" />
                    <Skeleton className="h-10 w-40 bg-white/10" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl bg-white/10" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Organizations</h1>
                    <p className="text-gray-400">Manage your organizations and workspaces.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary-600 hover:bg-primary-700 text-white gap-2 shadow-lg shadow-primary-900/20 border-0">
                            <Plus className="w-4 h-4" /> New Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Organization</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Create a workspace to share projects and teams with your team.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="org-name" className="text-gray-300">Organization Name</Label>
                                <Input
                                    id="org-name"
                                    value={newName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="bg-black/50 border-white/20 text-white focus-visible:ring-primary-500"
                                    placeholder="Acme Corp"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="org-slug" className="text-gray-300">Slug</Label>
                                <Input
                                    id="org-slug"
                                    value={newSlug}
                                    onChange={(e) => setNewSlug(e.target.value)}
                                    className="bg-black/50 border-white/20 text-white focus-visible:ring-primary-500 font-mono"
                                    placeholder="acme-corp"
                                />
                                <p className="text-xs text-gray-500">Used in URLs — lowercase letters, numbers, and hyphens only.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateOrg} disabled={creating || !newName.trim() || !newSlug.trim()} className="bg-primary-600 hover:bg-primary-700 text-white">
                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Organization
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgs.map((org, index) => (
                    <motion.div
                        key={org.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                    >
                        <Card
                            className="bg-black/40 border-white/10 text-white backdrop-blur-sm hover:border-primary-500/50 transition-colors group cursor-pointer relative"
                            onClick={() => router.push(`/platform/organizations/${org.id}`)}
                        >
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center border border-white/5">
                                        <Building2 className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg leading-none">{org.name}</CardTitle>
                                        <CardDescription className="text-xs text-gray-500 font-mono mt-1.5">/{org.slug}</CardDescription>
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
                                            <DropdownMenuItem
                                                className="focus:bg-white/10 cursor-pointer"
                                                onClick={() => handleSwitchToOrg(org)}
                                            >
                                                <Building2 className="mr-2 h-4 w-4" /> Switch to Org
                                            </DropdownMenuItem>
                                            {(org.role === 'owner' || org.role === 'admin') && (
                                                <DropdownMenuItem
                                                    className="focus:bg-white/10 cursor-pointer"
                                                    onClick={() => router.push(`/platform/organizations/${org.id}/settings`)}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" /> Settings
                                                </DropdownMenuItem>
                                            )}
                                            {org.role === 'owner' && (
                                                <DropdownMenuItem
                                                    className="focus:bg-white/10 cursor-pointer text-red-400 focus:text-red-400"
                                                    onClick={() => setOrgToDelete(org)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardFooter className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-xs text-gray-500">{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}</span>
                                <Badge className={`text-xs border ${ROLE_COLORS[org.role] ?? ROLE_COLORS.member}`}>{org.role}</Badge>
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
                            <h3 className="text-lg font-medium text-gray-300 group-hover:text-white">New Organization</h3>
                            <p className="text-sm text-gray-500 mt-1">Create a shared workspace</p>
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* Delete Dialog */}
            <Dialog open={!!orgToDelete} onOpenChange={(open) => { if (!open) { setOrgToDelete(null); setDeleteConfirmName(''); } }}>
                <DialogContent className="bg-neutral-900 border-red-900/50 text-white sm:max-w-[425px] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
                    <DialogHeader className="pt-4">
                        <DialogTitle className="text-red-500">Delete Organization</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            This will permanently delete <span className="text-white font-semibold">{orgToDelete?.name}</span> and all its teams. Projects will become personal.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label className="text-gray-300 text-sm">Type <span className="font-mono text-white bg-black/50 px-1 py-0.5 rounded">{orgToDelete?.name}</span> to confirm.</Label>
                        <Input
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder={orgToDelete?.name}
                            className="bg-black/50 border-red-900/30 focus-visible:ring-red-500/50 text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setOrgToDelete(null); setDeleteConfirmName(''); }} className="text-gray-400 hover:text-white hover:bg-white/10">Cancel</Button>
                        <Button
                            onClick={handleDeleteOrg}
                            disabled={deleteConfirmName !== orgToDelete?.name || deleting}
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
