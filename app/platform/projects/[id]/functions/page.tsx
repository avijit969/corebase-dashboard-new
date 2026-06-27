"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useApiKey } from "@/lib/stores/project-store";
import { Code, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { FunctionDef, Deployment, Invocation } from "./_components/types";
import { CreateFunctionSheet } from "./_components/CreateFunctionSheet";
import { FunctionCard } from "./_components/FunctionCard";
import { InvokeFunctionDialog } from "./_components/InvokeFunctionDialog";
import { DeploymentsDialog } from "./_components/DeploymentsDialog";
import { InvocationsDialog } from "./_components/InvocationsDialog";

export default function FunctionsPage() {
    const router = useRouter();
    const apiKey = useApiKey();

    const [functions, setFunctions] = useState<FunctionDef[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit sheet
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Invoke dialog
    const [invokeOpen, setInvokeOpen] = useState(false);
    const [invokeFn, setInvokeFn] = useState<FunctionDef | null>(null);

    // Deployments dialog
    const [deploymentsOpen, setDeploymentsOpen] = useState(false);
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [deploymentsLoading, setDeploymentsLoading] = useState(false);
    const [deploymentsFnId, setDeploymentsFnId] = useState<string | null>(null);

    // Invocations dialog
    const [invocationsOpen, setInvocationsOpen] = useState(false);
    const [invocations, setInvocations] = useState<Invocation[]>([]);
    const [invocationsLoading, setInvocationsLoading] = useState(false);
    const [invocationsFnId, setInvocationsFnId] = useState<string | null>(null);

    useEffect(() => {
        if (!apiKey) {
            setLoading(false);
            return;
        }
        fetchFunctions();
    }, [apiKey]);

    const fetchFunctions = async () => {
        if (!apiKey) return;
        setLoading(true);
        try {
            const res = await api.functions.list(apiKey);
            setFunctions(Array.isArray(res) ? res : res.functions || []);
        } catch (error) {
            console.error("Failed to fetch functions", error);
            toast.error("Failed to load functions");
        } finally {
            setLoading(false);
        }
    };

    const handleDeploy = (_id: string) => {
        // Deployment runs on Cloudflare Workers for Platforms (paid add-on) — not enabled yet.
        toast.info("🚀 Function deployment is coming soon!", {
            description: "You can write and save functions now. Live deployment will be available shortly.",
        });
    };

    const handleDelete = async (id: string) => {
        if (!apiKey) return;
        if (!confirm("Are you sure you want to delete this function? Its deployed worker will be removed.")) return;
        try {
            const res = await api.functions.delete(apiKey, id);
            if (res?.warning) toast.warning(res.warning);
            else toast.success("Function deleted successfully");
            fetchFunctions();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete function");
        }
    };

    const openEdit = (id: string) => {
        setEditId(id);
        setEditOpen(true);
    };

    const openInvoke = (fn: FunctionDef) => {
        setInvokeFn(fn);
        setInvokeOpen(true);
    };

    const fetchDeployments = async (id: string) => {
        if (!apiKey) return;
        setDeploymentsLoading(true);
        try {
            const res = await api.functions.listDeployments(apiKey, id);
            setDeployments(res.deployments || []);
        } catch (error) {
            toast.error("Failed to load deployments");
        } finally {
            setDeploymentsLoading(false);
        }
    };

    const openDeployments = (id: string) => {
        setDeploymentsFnId(id);
        setDeploymentsOpen(true);
        fetchDeployments(id);
    };

    const fetchInvocations = async (id: string) => {
        if (!apiKey) return;
        setInvocationsLoading(true);
        try {
            const res = await api.functions.listInvocations(apiKey, id);
            setInvocations(res.invocations || []);
        } catch (error) {
            toast.error("Failed to load invocations");
        } finally {
            setInvocationsLoading(false);
        }
    };

    const openInvocations = (id: string) => {
        setInvocationsFnId(id);
        setInvocationsOpen(true);
        fetchInvocations(id);
    };

    if (!apiKey) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[calc(100vh-100px)]">
                <div className="p-4 rounded-full bg-neutral-900 border border-white/5 mb-4 shadow-xl">
                    <Code className="w-8 h-8 text-neutral-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Project Selected</h3>
                <p className="text-neutral-500 max-w-sm mb-6">
                    Please select a project from the sidebar to manage Functions.
                </p>
                <Button onClick={() => router.push("/platform")} className="bg-primary-600 hover:bg-primary-500 text-white">
                    Go to Projects
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                            <Code className="w-5 h-5 text-primary-500" />
                        </div>
                        Functions
                    </h2>
                    <p className="text-neutral-400 mt-2 text-sm max-w-lg">
                        Deploy and run serverless functions on the edge — triggered by HTTP, cron, or database events.
                    </p>
                </div>

                <CreateFunctionSheet onSuccess={fetchFunctions} />
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 w-full bg-white/5 rounded-xl border border-white/10" />
                    ))}
                </div>
            ) : functions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-dashed border-white/10 rounded-xl bg-white/2 mt-10">
                    <div className="p-4 rounded-full bg-neutral-900 border border-white/5 mb-4 shadow-xl">
                        <Zap className="w-8 h-8 text-neutral-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Functions Yet</h3>
                    <p className="text-neutral-500 max-w-sm text-center mb-6">
                        You haven't created any functions yet. Write your first function and deploy it to the edge.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {functions.map((fn) => (
                        <FunctionCard
                            key={fn.id}
                            fn={fn}
                            onDeploy={handleDeploy}
                            onInvoke={openInvoke}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onViewDeployments={openDeployments}
                            onViewInvocations={openInvocations}
                        />
                    ))}
                </div>
            )}

            {/* Edit sheet */}
            <CreateFunctionSheet
                mode="edit"
                functionId={editId || undefined}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSuccess={fetchFunctions}
            />

            <InvokeFunctionDialog open={invokeOpen} onOpenChange={setInvokeOpen} fn={invokeFn} apiKey={apiKey} />

            <DeploymentsDialog
                open={deploymentsOpen}
                onOpenChange={setDeploymentsOpen}
                deployments={deployments}
                loading={deploymentsLoading}
                onRefresh={() => deploymentsFnId && fetchDeployments(deploymentsFnId)}
            />

            <InvocationsDialog
                open={invocationsOpen}
                onOpenChange={setInvocationsOpen}
                invocations={invocations}
                loading={invocationsLoading}
                onRefresh={() => invocationsFnId && fetchInvocations(invocationsFnId)}
            />
        </div>
    );
}
