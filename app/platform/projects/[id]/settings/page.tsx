"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ProjectSettings } from '../_components/ProjectSettings';
import { ProjectDetails } from '../types';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectStore } from '@/lib/stores/project-store';

export default function ProjectSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const { setProjectName } = useProjectStore();

    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("platform_token");
        if (id && token) {
            fetchProject(id, token);
        }
    }, [id]);

    const fetchProject = async (projectId: string, token: string) => {
        try {
            setLoading(true);
            const data = await api.projects.get(projectId, token);
            setProject(data);
        } catch (error: any) {
            console.error("Failed to fetch project", error);
            toast.error("Failed to load project settings");
        } finally {
            setLoading(false);
        }
    };

    const handleRenameProject = async (name: string) => {
        if (!id) return;
        const token = localStorage.getItem("platform_token");
        if (!token) return;

        await api.projects.update(id, token, { name });
        setProject(prev => prev ? { ...prev, meta: { ...prev.meta, name } } : prev);
        setProjectName(name);
        toast.success("Project renamed successfully");
    };

    const handleDeleteProject = async () => {
        if (!project || !id) return;

        try {
            const token = localStorage.getItem("platform_token");
            if (!token) return;

            await api.projects.delete(id, token);
            toast.success("Project deleted successfully");
            router.push('/platform');
        } catch (error: any) {
            toast.error("Failed to delete project");
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 p-4">
                <Skeleton className="h-8 w-32 bg-white/10" />
                <Skeleton className="h-48 w-full bg-white/10 rounded-lg" />
            </div>
        );
    }

    if (!project) return <div>Project not found</div>;

    return (
        <div className="space-y-6 p-4">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <ProjectSettings
                projectName={project.meta.name}
                handleDeleteProject={handleDeleteProject}
                handleRenameProject={handleRenameProject}
            />
        </div>
    );
}
