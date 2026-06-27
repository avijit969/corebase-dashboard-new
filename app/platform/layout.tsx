"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Layers, LogOut, Settings, User, Menu, Building2, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useOrgStore } from '@/lib/stores/org-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { MobileSidebar, PlatformSidebar } from '@/components/PlatformSidebar';


export default function PlatformLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const closeSidebar = React.useCallback(() => setSidebarOpen(false), []);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [checkingOrgs, setCheckingOrgs] = useState(true);
    const [userOrgs, setUserOrgs] = useState<any[]>([]);

    // Org creation form state
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgSlug, setNewOrgSlug] = useState('');
    const [creatingOrg, setCreatingOrg] = useState(false);

    const router = useRouter();
    const { logout } = useAuthStore();
    const { setOrg } = useOrgStore();

    // Check user authentication and load organizations
    useEffect(() => {
        const checkAuthAndOrgs = async () => {
            const token = localStorage.getItem("platform_token");
            if (!token) {
                router.push("/platform/login");
                setIsAuthLoading(false);
                setCheckingOrgs(false);
                return;
            }
            setIsAuthLoading(false);

            try {
                const orgData = await api.orgs.list(token);
                const list = Array.isArray(orgData) ? orgData : [];
                setUserOrgs(list);

                // If there's an organization but no current org is set, select the first one
                const activeOrgId = localStorage.getItem("org") ? JSON.parse(localStorage.getItem("org") || '{}')?.state?.currentOrgId : null;
                if (list.length > 0 && !activeOrgId) {
                    setOrg(list[0].id, list[0].name);
                }
            } catch (err) {
                console.error("Failed to load organizations in layout:", err);
            } finally {
                setCheckingOrgs(false);
            }
        };

        checkAuthAndOrgs();
    }, [router, setOrg]);

    const handleNameChange = (value: string) => {
        setNewOrgName(value);
        setNewOrgSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    };

    const handleCreateFirstOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("platform_token");
        if (!newOrgName.trim() || !newOrgSlug.trim() || !token) return;

        setCreatingOrg(true);
        try {
            const org = await api.orgs.create(token, newOrgName.trim(), newOrgSlug.trim());
            toast.success("Organization created successfully!");
            setOrg(org.id, org.name);
            setUserOrgs([org]); // This triggers re-render and unlocks the dashboard
        } catch (error: any) {
            toast.error("Failed to create organization", {
                description: error.message || "An error occurred."
            });
        } finally {
            setCreatingOrg(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (isAuthLoading || (checkingOrgs && !pathname?.startsWith('/platform/login') && !pathname?.startsWith('/platform/signup'))) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // Conditionally render layout based on route
    if (pathname?.startsWith('/platform/login') || pathname?.startsWith('/platform/signup')) {
        return (
            <div className="min-h-screen bg-black text-white font-sans overflow-auto relative">
                {/* Background Gradients for Auth Pages */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
                {children}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex font-sans">
            <PlatformSidebar />
            <MobileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-neutral-900/20 relative">
                {/* Mobile Header */}
                <div className="md:hidden h-16 border-b border-white/10 flex items-center px-4 bg-black sticky top-0 z-40 gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="-ml-2 text-gray-400 hover:text-white">
                        <Menu className="w-5 h-5" />
                    </Button>
                    <Link href="/" className="flex items-center">
                        <img src="/logo/dark.svg" alt="CoreBase Logo" className="h-6 w-auto" />
                    </Link>
                </div>
                {children}
            </main>

            {/* First-time Organization Dialog */}
            <Dialog open={userOrgs.length === 0} onOpenChange={() => {}}>
                <DialogContent
                    className="bg-neutral-900 border-white/10 text-white sm:max-w-[425px]"
                    showCloseButton={false}
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <Building2 className="w-5 h-5 text-primary-400" />
                            Create your Organization
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 pt-1">
                            To get started with CoreBase, you need to create an organization first.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateFirstOrg} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="org-name" className="text-gray-300">
                                Organization Name
                            </Label>
                            <Input
                                id="org-name"
                                value={newOrgName}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="bg-black/50 border-white/20 text-white focus-visible:ring-primary-500"
                                placeholder="Acme Corp"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="org-slug" className="text-gray-300">
                                Slug
                            </Label>
                            <Input
                                id="org-slug"
                                value={newOrgSlug}
                                onChange={(e) => setNewOrgSlug(e.target.value)}
                                className="bg-black/50 border-white/20 text-white focus-visible:ring-primary-500 font-mono"
                                placeholder="acme-corp"
                                required
                            />
                            <p className="text-[10px] text-gray-500">
                                Lowercase letters, numbers, and hyphens only.
                            </p>
                        </div>

                        <DialogFooter className="pt-2 flex items-center justify-between gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleLogout}
                                className="text-xs text-gray-500 hover:text-white hover:bg-white/5"
                            >
                                Sign out
                            </Button>
                            <Button
                                type="submit"
                                disabled={creatingOrg || !newOrgName.trim() || !newOrgSlug.trim()}
                                className="bg-primary-600 hover:bg-primary-700 text-white border-0"
                            >
                                {creatingOrg ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Organization"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}


