"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Loader2, Settings, Trash2, FolderPlus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface TeamMember {
    userId: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
}

interface TeamProject {
    id: string;
    name: string;
    status: string;
    createdAt: string;
}

interface TeamDetail {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
    myRole: string;
    members: TeamMember[];
}

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
    admin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    member: 'bg-green-500/20 text-green-300 border-green-500/30',
    viewer: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export default function TeamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params?.id as string;

    const [team, setTeam] = useState<TeamDetail | null>(null);
    const [projects, setProjects] = useState<TeamProject[]>([]);
    const [allMyProjects, setAllMyProjects] = useState<TeamProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<string>('viewer');

    // Add member state
    const [addEmail, setAddEmail] = useState('');
    const [addRole, setAddRole] = useState('member');
    const [adding, setAdding] = useState(false);
    const [addMemberSheetOpen, setAddMemberSheetOpen] = useState(false);

    // Assign project state
    const [assignProjectSheetOpen, setAssignProjectSheetOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [removingProjectId, setRemovingProjectId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("platform_token");
        if (!stored) { router.push("/platform/login"); return; }
        setToken(stored);
        Promise.all([fetchTeam(stored), fetchProjects(stored), fetchMyProjects(stored)]);
    }, [teamId, router]);

    const fetchTeam = async (authToken: string) => {
        try {
            setLoading(true);
            const data = await api.teams.get(authToken, teamId);
            setTeam(data);
            setMyRole(data.myRole);
        } catch {
            toast.error("Failed to load team");
            router.push('/platform/teams');
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async (authToken: string) => {
        try {
            const data = await api.teams.listProjects(authToken, teamId);
            setProjects(Array.isArray(data) ? data : []);
        } catch {
            // team may not have projects yet
        }
    };

    const fetchMyProjects = async (authToken: string) => {
        try {
            const data = await api.projects.list(authToken);
            setAllMyProjects(Array.isArray(data) ? data : []);
        } catch {
            // silently ignore
        }
    };

    // Projects owned by the user that are NOT yet in this team
    const unassignedProjects = allMyProjects.filter(
        p => !projects.some(tp => tp.id === p.id)
    );

    const handleAddMember = async () => {
        if (!addEmail.trim() || !token) return;
        setAdding(true);
        try {
            const member = await api.teams.addMember(token, teamId, addEmail.trim(), addRole);
            setTeam(prev => prev ? {
                ...prev,
                members: [...prev.members, {
                    userId: member.user.id,
                    name: member.user.name,
                    email: member.user.email,
                    role: member.role,
                    joinedAt: new Date().toISOString()
                }]
            } : prev);
            toast.success(`${addEmail} added to team`);
            setAddEmail('');
            setAddRole('member');
            setAddMemberSheetOpen(false);
        } catch (error: any) {
            toast.error("Failed to add member", { description: error.message });
        } finally {
            setAdding(false);
        }
    };

    const handleRoleChange = async (userId: string, role: string) => {
        if (!token) return;
        try {
            await api.teams.updateMember(token, teamId, userId, role);
            setTeam(prev => prev ? {
                ...prev,
                members: prev.members.map(m => m.userId === userId ? { ...m, role } : m)
            } : prev);
            toast.success("Role updated");
        } catch (error: any) {
            toast.error("Failed to update role", { description: error.message });
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!token) return;
        try {
            await api.teams.removeMember(token, teamId, userId);
            setTeam(prev => prev ? {
                ...prev,
                members: prev.members.filter(m => m.userId !== userId)
            } : prev);
            toast.success("Member removed");
        } catch (error: any) {
            toast.error("Failed to remove member", { description: error.message });
        }
    };

    const handleAssignProject = async () => {
        if (!selectedProjectId || !token) return;
        setAssigning(true);
        try {
            await api.teams.assignProject(token, teamId, selectedProjectId);
            const assigned = allMyProjects.find(p => p.id === selectedProjectId);
            if (assigned) {
                setProjects(prev => [...prev, assigned]);
            }
            toast.success("Project assigned to team");
            setSelectedProjectId('');
            setAssignProjectSheetOpen(false);
        } catch (error: any) {
            toast.error("Failed to assign project", { description: error.message });
        } finally {
            setAssigning(false);
        }
    };

    const handleRemoveProject = async (projectId: string) => {
        if (!token) return;
        setRemovingProjectId(projectId);
        try {
            await api.teams.removeProject(token, teamId, projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            toast.success("Project removed from team");
        } catch (error: any) {
            toast.error("Failed to remove project", { description: error.message });
        } finally {
            setRemovingProjectId(null);
        }
    };

    const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

    if (loading) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
                <Skeleton className="h-8 w-48 bg-white/10" />
                <Skeleton className="h-64 w-full bg-white/10 rounded-xl" />
            </div>
        );
    }

    if (!team) return null;

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/platform/teams')} className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{team.name}</h1>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{team.id}</p>
                    </div>
                    <Badge className={`text-xs border ${ROLE_COLORS[myRole] ?? ROLE_COLORS.member}`}>{myRole}</Badge>
                </div>
                {myRole === 'owner' && (
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/platform/teams/${teamId}/settings`)} className="text-gray-400 hover:text-white">
                        <Settings className="w-5 h-5" />
                    </Button>
                )}
            </div>

            <Tabs defaultValue="members">
                <TabsList className="bg-white/5 border border-white/10 mb-6">
                    <TabsTrigger value="members" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400">Members</TabsTrigger>
                    <TabsTrigger value="projects" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400">Projects</TabsTrigger>
                </TabsList>

                {/* Members Tab */}
                <TabsContent value="members">
                    <Card className="bg-neutral-900/50 border-white/10 text-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Members</CardTitle>
                                <CardDescription className="text-gray-400">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</CardDescription>
                            </div>
                            {isAdminOrOwner && (
                                <Sheet open={addMemberSheetOpen} onOpenChange={setAddMemberSheetOpen}>
                                    <SheetTrigger asChild>
                                        <Button className="bg-primary-600 hover:bg-primary-700 text-white gap-2">
                                            <UserPlus className="w-4 h-4" /> Add Member
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="bg-neutral-900 border-white/10 text-white">
                                        <SheetHeader>
                                            <SheetTitle className="text-white">Add Member</SheetTitle>
                                            <SheetDescription className="text-gray-400">
                                                Invite a user by their email address.
                                            </SheetDescription>
                                        </SheetHeader>
                                        <div className="mt-6 space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-gray-300">Email</Label>
                                                <Input
                                                    value={addEmail}
                                                    onChange={(e) => setAddEmail(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                                                    placeholder="user@example.com"
                                                    className="bg-black/50 border-white/10 text-white focus-visible:ring-primary-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-gray-300">Role</Label>
                                                <Select value={addRole} onValueChange={setAddRole}>
                                                    <SelectTrigger className="bg-black/50 border-white/10 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="member">Member</SelectItem>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                onClick={handleAddMember}
                                                disabled={adding || !addEmail.trim()}
                                                className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                                            >
                                                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Add Member
                                            </Button>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-gray-400">Name</TableHead>
                                        <TableHead className="text-gray-400">Email</TableHead>
                                        <TableHead className="text-gray-400">Role</TableHead>
                                        <TableHead className="text-gray-400">Joined</TableHead>
                                        {isAdminOrOwner && <TableHead className="w-12" />}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {team.members.map((member) => (
                                        <TableRow key={member.userId} className="border-white/10 hover:bg-white/5">
                                            <TableCell className="font-medium text-white">{member.name || '—'}</TableCell>
                                            <TableCell className="text-gray-400">{member.email}</TableCell>
                                            <TableCell>
                                                {isAdminOrOwner && member.role !== 'owner' ? (
                                                    <Select
                                                        value={member.role}
                                                        onValueChange={(role) => handleRoleChange(member.userId, role)}
                                                    >
                                                        <SelectTrigger className="h-7 w-28 bg-black/30 border-white/10 text-white text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                            <SelectItem value="member">Member</SelectItem>
                                                            <SelectItem value="viewer">Viewer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge className={`text-xs border ${ROLE_COLORS[member.role] ?? ROLE_COLORS.member}`}>{member.role}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}
                                            </TableCell>
                                            {isAdminOrOwner && (
                                                <TableCell>
                                                    {member.role !== 'owner' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-gray-500 hover:text-red-400"
                                                            onClick={() => handleRemoveMember(member.userId)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects">
                    <Card className="bg-neutral-900/50 border-white/10 text-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Shared Projects</CardTitle>
                                <CardDescription className="text-gray-400">
                                    {projects.length} project{projects.length !== 1 ? 's' : ''} shared with this team.
                                </CardDescription>
                            </div>
                            {isAdminOrOwner && (
                                <Sheet open={assignProjectSheetOpen} onOpenChange={(open) => {
                                    setAssignProjectSheetOpen(open);
                                    if (open) setSelectedProjectId('');
                                }}>
                                    <SheetTrigger asChild>
                                        <Button className="bg-primary-600 hover:bg-primary-700 text-white gap-2">
                                            <FolderPlus className="w-4 h-4" /> Assign Project
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="bg-neutral-900 border-white/10 text-white">
                                        <SheetHeader>
                                            <SheetTitle className="text-white">Assign Project</SheetTitle>
                                            <SheetDescription className="text-gray-400">
                                                Share one of your projects with this team. Only projects you own can be assigned.
                                            </SheetDescription>
                                        </SheetHeader>
                                        <div className="mt-6 space-y-4">
                                            {unassignedProjects.length === 0 ? (
                                                <p className="text-gray-500 text-sm">
                                                    {allMyProjects.length === 0
                                                        ? "You don't have any projects yet."
                                                        : "All your projects are already assigned to this team."}
                                                </p>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-300">Select Project</Label>
                                                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                                            <SelectTrigger className="bg-black/50 border-white/10 text-white">
                                                                <SelectValue placeholder="Choose a project…" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                                {unassignedProjects.map(p => (
                                                                    <SelectItem key={p.id} value={p.id}>
                                                                        {p.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        onClick={handleAssignProject}
                                                        disabled={assigning || !selectedProjectId}
                                                        className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                                                    >
                                                        {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Assign to Team
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}
                        </CardHeader>
                        <CardContent>
                            {projects.length === 0 ? (
                                <div className="text-center py-10 space-y-3">
                                    <p className="text-gray-500 text-sm">No projects shared with this team yet.</p>
                                    {isAdminOrOwner && (
                                        <Button
                                            variant="outline"
                                            className="border-white/10 text-gray-300 hover:bg-white/5 gap-2"
                                            onClick={() => setAssignProjectSheetOpen(true)}
                                        >
                                            <FolderPlus className="w-4 h-4" /> Assign your first project
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="text-gray-400">Name</TableHead>
                                            <TableHead className="text-gray-400">Status</TableHead>
                                            <TableHead className="text-gray-400">Created</TableHead>
                                            {isAdminOrOwner && <TableHead className="w-20" />}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projects.map((project) => (
                                            <TableRow key={project.id} className="border-white/10 hover:bg-white/5">
                                                <TableCell className="font-medium text-white">{project.name}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs">{project.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-sm">
                                                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}
                                                </TableCell>
                                                {isAdminOrOwner && (
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-gray-500 hover:text-white"
                                                                onClick={() => router.push(`/platform/projects/${project.id}`)}
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-gray-500 hover:text-red-400"
                                                                disabled={removingProjectId === project.id}
                                                                onClick={() => handleRemoveProject(project.id)}
                                                            >
                                                                {removingProjectId === project.id
                                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                    : <Trash2 className="w-3.5 h-3.5" />}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
