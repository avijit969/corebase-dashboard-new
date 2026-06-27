"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Users, Settings, Loader2, UserPlus, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OrgMember {
    userId: string;
    role: string;
    joinedAt: string;
    name: string;
    email: string;
}

interface OrgTeam {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
    role: string;
}

interface OrgDetail {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    createdAt: string;
    myRole: string;
    members: OrgMember[];
}

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
    admin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    member: 'bg-green-500/20 text-green-300 border-green-500/30',
};

export default function OrgDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orgId = params.id as string;

    const [org, setOrg] = useState<OrgDetail | null>(null);
    const [teams, setTeams] = useState<OrgTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviting, setInviting] = useState(false);

    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("platform_token");
        if (!stored) { router.push("/platform/login"); return; }
        setToken(stored);
        fetchOrg(stored);
        fetchTeams(stored);
    }, [orgId, router]);

    const fetchOrg = async (authToken: string) => {
        try {
            setLoading(true);
            const data = await api.orgs.get(authToken, orgId);
            setOrg(data);
        } catch {
            toast.error("Failed to load organization");
            router.push("/platform/organizations");
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async (authToken: string) => {
        try {
            const data = await api.teams.list(authToken, orgId);
            setTeams(Array.isArray(data) ? data : []);
        } catch {
            // non-fatal
        }
    };

    const handleUpdateMemberRole = async (userId: string, role: string) => {
        if (!token) return;
        try {
            await api.orgs.updateMember(token, orgId, userId, role);
            setOrg(prev => prev ? {
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
        setRemovingId(userId);
        try {
            await api.orgs.removeMember(token, orgId, userId);
            setOrg(prev => prev ? {
                ...prev,
                members: prev.members.filter(m => m.userId !== userId)
            } : prev);
            toast.success("Member removed");
        } catch (error: any) {
            toast.error("Failed to remove member", { description: error.message });
        } finally {
            setRemovingId(null);
        }
    };

    const handleInviteMember = async () => {
        if (!inviteEmail.trim() || !token) return;
        setInviting(true);
        try {
            const result = await api.orgs.addMember(token, orgId, inviteEmail.trim(), inviteRole);
            setOrg(prev => prev ? {
                ...prev,
                members: [...prev.members, {
                    userId: result.user.id,
                    role: result.role,
                    joinedAt: new Date().toISOString(),
                    name: result.user.name,
                    email: result.user.email
                }]
            } : prev);
            setIsAddMemberOpen(false);
            setInviteEmail('');
            setInviteRole('member');
            toast.success("Member added");
        } catch (error: any) {
            toast.error("Failed to add member", { description: error.message });
        } finally {
            setInviting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
                <Skeleton className="h-10 w-64 bg-white/10" />
                <Skeleton className="h-64 w-full bg-white/10" />
            </div>
        );
    }

    if (!org) return null;

    const canManage = org.myRole === 'owner' || org.myRole === 'admin';

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-full">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push('/platform/organizations')} className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{org.name}</h1>
                    <p className="text-gray-500 text-sm font-mono">/{org.slug}</p>
                </div>
                {canManage && (
                    <Button variant="outline" size="sm" className="ml-auto border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                        onClick={() => router.push(`/platform/organizations/${orgId}/settings`)}>
                        <Settings className="w-4 h-4 mr-2" /> Settings
                    </Button>
                )}
            </div>

            <Tabs defaultValue="members">
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="members" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400">
                        <Users className="w-4 h-4 mr-2" /> Members ({org.members.length})
                    </TabsTrigger>
                    <TabsTrigger value="teams" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400">
                        Teams ({teams.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-6">
                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle>Members</CardTitle>
                                <CardDescription className="text-gray-500">People with access to this organization.</CardDescription>
                            </div>
                            {canManage && (
                                <Sheet open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                                    <SheetTrigger asChild>
                                        <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white border-0">
                                            <UserPlus className="w-4 h-4 mr-2" /> Add Member
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="bg-neutral-900 border-white/10 text-white">
                                        <SheetHeader>
                                            <SheetTitle className="text-white">Add Member</SheetTitle>
                                            <SheetDescription className="text-gray-400">Invite someone by email.</SheetDescription>
                                        </SheetHeader>
                                        <div className="mt-6 space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-gray-300">Email</Label>
                                                <Input
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    placeholder="colleague@company.com"
                                                    className="bg-black/50 border-white/20 text-white focus-visible:ring-primary-500"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-gray-300">Role</Label>
                                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                                    <SelectTrigger className="bg-black/50 border-white/20 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                        <SelectItem value="member">Member</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <SheetFooter className="mt-6">
                                            <Button onClick={handleInviteMember} disabled={!inviteEmail.trim() || inviting} className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                                                {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Add Member
                                            </Button>
                                        </SheetFooter>
                                    </SheetContent>
                                </Sheet>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-gray-400">Name</TableHead>
                                        <TableHead className="text-gray-400">Email</TableHead>
                                        <TableHead className="text-gray-400">Role</TableHead>
                                        <TableHead className="text-gray-400">Joined</TableHead>
                                        {canManage && <TableHead />}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {org.members.map(member => (
                                        <TableRow key={member.userId} className="border-white/10 hover:bg-white/5">
                                            <TableCell className="font-medium text-white">{member.name || '—'}</TableCell>
                                            <TableCell className="text-gray-400 text-sm">{member.email}</TableCell>
                                            <TableCell>
                                                {canManage && member.role !== 'owner' ? (
                                                    <Select value={member.role} onValueChange={(role) => handleUpdateMemberRole(member.userId, role)}>
                                                        <SelectTrigger className="h-7 w-24 bg-black/50 border-white/10 text-white text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                            <SelectItem value="member">member</SelectItem>
                                                            <SelectItem value="admin">admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge className={`text-xs border ${ROLE_COLORS[member.role] ?? ROLE_COLORS.member}`}>{member.role}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-xs">{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}</TableCell>
                                            {canManage && (
                                                <TableCell className="text-right">
                                                    {member.role !== 'owner' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-gray-500 hover:text-red-400"
                                                            disabled={removingId === member.userId}
                                                            onClick={() => handleRemoveMember(member.userId)}
                                                        >
                                                            {removingId === member.userId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
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

                <TabsContent value="teams" className="mt-6">
                    <Card className="bg-black/40 border-white/10 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle>Teams</CardTitle>
                                <CardDescription className="text-gray-500">Sub-groups within this organization.</CardDescription>
                            </div>
                            <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white border-0"
                                onClick={() => router.push('/platform/teams')}>
                                Manage Teams
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {teams.length === 0 ? (
                                <div className="py-12 text-center text-gray-500">
                                    <p>No teams in this organization yet.</p>
                                    <p className="text-sm mt-1">Create a team and assign it to this org.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="text-gray-400">Name</TableHead>
                                            <TableHead className="text-gray-400">Your Role</TableHead>
                                            <TableHead className="text-gray-400">Created</TableHead>
                                            <TableHead />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {teams.map(team => (
                                            <TableRow key={team.id} className="border-white/10 hover:bg-white/5 cursor-pointer"
                                                onClick={() => router.push(`/platform/teams/${team.id}`)}>
                                                <TableCell className="font-medium text-white">{team.name}</TableCell>
                                                <TableCell>
                                                    <Badge className={`text-xs border ${ROLE_COLORS[team.role] ?? ROLE_COLORS.member}`}>{team.role}</Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-xs">{team.createdAt ? new Date(team.createdAt).toLocaleDateString() : '—'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs">View →</Button>
                                                </TableCell>
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
