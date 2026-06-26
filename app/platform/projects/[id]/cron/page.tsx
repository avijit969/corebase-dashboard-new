"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useApiKey } from "@/lib/stores/project-store";
import { Clock, History, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { CronJob, CronExecution } from "./_components/types";
import { CreateCronJobSheet } from "./_components/CreateCronJobSheet";
import { CronJobCard } from "./_components/CronJobCard";
import { CronExecutionsDialog } from "./_components/CronExecutionsDialog";

export default function CronJobsPage() {
    const router = useRouter();
    const apiKey = useApiKey();

    const [jobs, setJobs] = useState<CronJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [executionsOpen, setExecutionsOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [executions, setExecutions] = useState<CronExecution[]>([]);
    const [executionsLoading, setExecutionsLoading] = useState(false);

    useEffect(() => {
        if (!apiKey) {
            setLoading(false);
            return;
        }
        fetchJobs();
    }, [apiKey]);

    const fetchJobs = async () => {
        if (!apiKey) return;
        setLoading(true);
        try {
            const res = await api.cron.list(apiKey);
            setJobs(res.jobs || []);
        } catch (error) {
            console.error("Failed to fetch cron jobs", error);
            toast.error("Failed to load cron jobs");
        } finally {
            setLoading(false);
        }
    };

    const fetchExecutions = async (id: string) => {
        if (!apiKey) return;
        setExecutionsLoading(true);
        try {
            const res = await api.cron.listExecutions(apiKey, id);
            setExecutions(res.executions || []);
        } catch (error) {
            console.error("Failed to fetch executions", error);
            toast.error("Failed to load execution history");
        } finally {
            setExecutionsLoading(false);
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (!apiKey) return;
        if (!confirm("Are you sure you want to delete this cron job?")) return;
        try {
            await api.cron.delete(apiKey, id);
            toast.success("Cron job deleted successfully");
            fetchJobs();
        } catch (error) {
            toast.error("Failed to delete cron job");
        }
    };

    const openExecutions = (id: string) => {
        setSelectedJobId(id);
        setExecutionsOpen(true);
        fetchExecutions(id);
    };

    if (!apiKey) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[calc(100vh-100px)]">
                <div className="p-4 rounded-full bg-neutral-900 border border-white/5 mb-4 shadow-xl">
                    <History className="w-8 h-8 text-neutral-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Project Selected</h3>
                <p className="text-neutral-500 max-w-sm mb-6">
                    Please select a project from the sidebar to manage Cron Jobs.
                </p>
                <Button
                    onClick={() => router.push('/platform')}
                    className="bg-primary-600 hover:bg-primary-500 text-white"
                >
                    Go to Projects
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Clock className="w-5 h-5 text-purple-500" />
                        </div>
                        Cron Jobs
                    </h2>
                    <p className="text-neutral-400 mt-2 text-sm max-w-lg">
                        Schedule HTTP webhooks and automated tasks against any API.
                    </p>
                </div>

                <CreateCronJobSheet onSuccess={fetchJobs} />
            </div>

            {/* Content Section */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 w-full bg-white/5 rounded-xl border border-white/10" />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-white/10 rounded-xl bg-white/2 mt-10">
                    <div className="p-4 rounded-full bg-neutral-900 border border-white/5 mb-4 shadow-xl">
                        <Calendar className="w-8 h-8 text-neutral-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Scheduled Jobs</h3>
                    <p className="text-neutral-500 max-w-sm text-center mb-6">
                        You haven't created any cron jobs yet. Build your first job to start automating tasks.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {jobs.map((job) => (
                        <CronJobCard
                            key={job.id}
                            job={job}
                            onDelete={handleDeleteJob}
                            onViewExecutions={openExecutions}
                        />
                    ))}
                </div>
            )}

            <CronExecutionsDialog
                open={executionsOpen}
                onOpenChange={setExecutionsOpen}
                executions={executions}
                loading={executionsLoading}
                onRefresh={() => selectedJobId && fetchExecutions(selectedJobId)}
            />
        </div>
    );
}
