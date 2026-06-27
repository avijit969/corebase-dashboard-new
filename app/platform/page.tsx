"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, MoreVertical, Copy, Database, Loader2, AlertTriangle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectStore } from '@/lib/stores/project-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useOrgStore } from '@/lib/stores/org-store';

interface Project {
    id: string;
    name: string;
    api_key: string;
    status: string;
    created_at?: string;
    [key: string]: any;
}

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [creating, setCreating] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [projectToRename, setProjectToRename] = useState<Project | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [renaming, setRenaming] = useState(false);
    const { setApiKey, setProjectName } = useProjectStore();
    const { setUser } = useAuthStore();
    const { currentOrgId, currentOrgName } = useOrgStore();

    useEffect(() => {
        const init = async () => {
            const storedToken = localStorage.getItem("platform_token");
            if (!storedToken) {
                router.push("/platform/login");
                return;
            }
            setToken(storedToken);

            try {
                const userData = await api.auth.me(storedToken);
                if (userData) {
                    setUser({ email: userData.user.email, name: userData.user.name, id: userData.user.id });
                }
            } catch (error) {
                console.error("Failed to initialize platform:", error);
            }
        };

        init();
    }, [router, setUser]);

    useEffect(() => {
        if (token) fetchProjects(token);
    }, [token, currentOrgId]);

    const fetchProjects = async (authToken: string) => {
        try {
            setLoading(true);
            const data = await api.projects.list(authToken, currentOrgId ?? undefined);
            let projectsList: Project[] = [];
            if (Array.isArray(data)) {
                projectsList = data;
            } else if (data && Array.isArray(data.projects)) {
                projectsList = data?.projects;
            } else if (data && Array.isArray(data.data)) {
                projectsList = data?.data;
            }

            setProjects(projectsList);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName || !token) return;

        setCreating(true);
        try {
            const response = await api.projects.create(newProjectName, token, currentOrgId ?? undefined);

            const newProject: Project = {
                id: response.id,
                name: response.name,
                api_key: response.api_key,
                status: 'active',
                created_at: new Date().toISOString()
            };

            setProjects([...projects, newProject]);
            setIsCreateOpen(false);
            setNewProjectName('');
            toast.success("Project created successfully", {
                description: `API Key: ${response.api_key}`,
            });
        } catch (error: any) {
            toast.error("Failed to create project", {
                description: error.message || "An error occurred."
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete || !token || deleteConfirmName !== projectToDelete.name) return;

        setDeleting(true);
        try {
            await api.projects.delete(projectToDelete.id, token);
            setProjects(projects.filter(p => p.id !== projectToDelete.id));
            setProjectToDelete(null);
            setDeleteConfirmName('');
            toast.success("Project deleted successfully");
        } catch (error: any) {
            toast.error("Failed to delete project", {
                description: error.message || "An error occurred."
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleRenameProject = async () => {
        if (!projectToRename || !token || !renameValue.trim()) return;
        setRenaming(true);
        try {
            await api.projects.update(projectToRename.id, token, { name: renameValue.trim() });
            setProjects(projects.map(p => p.id === projectToRename.id ? { ...p, name: renameValue.trim() } : p));
            setProjectName(renameValue.trim());
            toast.success("Project renamed successfully");
            setProjectToRename(null);
            setRenameValue('');
        } catch (error: any) {
            toast.error("Failed to rename project", { description: error.message });
        } finally {
            setRenaming(false);
        }
    };

    const copyToClipboard = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto min-h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48 bg-white/10" />
                        <Skeleton className="h-4 w-64 bg-white/10" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-4 rounded-xl border border-white/10 bg-black/40 p-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32 bg-white/10" />
                                    <Skeleton className="h-3 w-20 bg-white/10" />
                                </div>
                            </div>
                            <div className="space-y-2 pt-4">
                                <Skeleton className="h-8 w-full bg-white/10" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {currentOrgName ? `${currentOrgName}` : 'Projects'}
                    </h1>
                    <p className="text-gray-400">
                        {currentOrgId ? 'Organization projects and shared workspaces.' : 'Your personal projects and API keys.'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64 hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search projects..."
                            className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-primary-500"
                        />
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary-600 hover:bg-primary-700 text-white gap-2 shadow-lg shadow-primary-900/20 border-0">
                                <Plus className="w-4 h-4" /> New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create Project</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                    Create a new project to get started with CoreBase.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-gray-300">Project Name</Label>
                                    <Input
                                        id="name"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        className="bg-black/50 border-white/20 text-white focus-visible:ring-primary-500"
                                        placeholder="My Awesome App"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateProject} disabled={creating} className="bg-primary-600 hover:bg-primary-700 text-white">
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Project
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length > 0 ? projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card
                            className="bg-black/40 border-white/10 text-white backdrop-blur-sm hover:border-primary-500/50 transition-colors group cursor-pointer relative"
                            onClick={() => {
                                router.push(`/platform/projects/${project.id}`)
                                // set project api key in store
                                setApiKey(project.api_key)
                                setProjectName(project.name)
                            }}
                        >
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center border border-white/5">
                                        <Database className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg leading-none">{project.name}</CardTitle>
                                        <CardDescription className="text-xs text-gray-500 font-mono mt-1.5">{project.id}</CardDescription>
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProjectToRename(project);
                                                    setRenameValue(project.name);
                                                }}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="focus:bg-white/10 cursor-pointer text-red-400 focus:text-red-400"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProjectToDelete(project);
                                                }}
                                            >
                                                Delete Project
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">API Key</Label>
                                        <div className="flex items-center gap-2 bg-black/50 p-2 rounded border border-white/5 group-hover:border-white/10 transition-colors">
                                            <code className="text-xs text-gray-300 flex-1 font-mono truncate">{project.api_key}</code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-500 hover:text-white"
                                                onClick={(e) => copyToClipboard(project.api_key, e)}
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-xs text-gray-500">{project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</span>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    <span className="text-xs text-gray-400 capitalize">{project.status || 'Active'}</span>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Database className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-lg">No projects found</p>
                        <p className="text-sm">Create your first project to get started.</p>
                    </div>
                )}

                {/* Create New Card Equivalent (Empty State-ish) */}
                {!loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={() => setIsCreateOpen(true)}
                        className="cursor-pointer"
                    >
                        <Card className="bg-white/5 border-dashed border-white/10 text-white h-full flex flex-col items-center justify-center min-h-[220px] hover:bg-white/10 hover:border-white/20 transition-all group">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-colors">
                                <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-300 group-hover:text-white">New Project</h3>
                            <p className="text-sm text-gray-500 mt-1">Add a new app to your workspace</p>
                        </Card>
                    </motion.div>
                )}
            </div>

            {/* Rename Dialog */}
            <Dialog open={!!projectToRename} onOpenChange={(open) => {
                if (!open) { setProjectToRename(null); setRenameValue(''); }
            }}>
                <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Rename Project</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Enter a new name for <span className="text-white font-semibold">{projectToRename?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameProject()}
                            className="bg-black/50 border-white/20 text-white focus-visible:ring-primary-500"
                            placeholder="Project name"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setProjectToRename(null); setRenameValue(''); }} className="text-gray-400 hover:text-white hover:bg-white/10">
                            Cancel
                        </Button>
                        <Button onClick={handleRenameProject} disabled={!renameValue.trim() || renaming} className="bg-primary-600 hover:bg-primary-700 text-white">
                            {renaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!projectToDelete} onOpenChange={(open) => {
                if (!open) {
                    setProjectToDelete(null);
                    setDeleteConfirmName('');
                }
            }}>
                <DialogContent className="bg-neutral-900 border-red-900/50 text-white sm:max-w-[425px] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                    <DialogHeader className="pt-4">
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="w-5 h-5" /> Delete Project
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 pt-2">
                            This action cannot be undone. This will permanently delete the
                            <span className="text-white font-semibold mx-1">{projectToDelete?.name}</span>
                            project and remove all associated data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-3">
                        <Label className="text-sm font-medium text-gray-300">
                            Please type <span className="text-white font-mono bg-black/50 px-1 py-0.5 rounded select-all mb-1 inline-block">{projectToDelete?.name}</span> to confirm.
                        </Label>
                        <Input
                            value={deleteConfirmName}
                            onChange={(e) => setDeleteConfirmName(e.target.value)}
                            placeholder={projectToDelete?.name}
                            className="bg-black/50 border-red-900/30 focus-visible:ring-red-500/50 text-white"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setProjectToDelete(null);
                                setDeleteConfirmName('');
                            }}
                            className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteProject}
                            disabled={deleteConfirmName !== projectToDelete?.name || deleting}
                            className="bg-red-600 hover:bg-red-700 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
