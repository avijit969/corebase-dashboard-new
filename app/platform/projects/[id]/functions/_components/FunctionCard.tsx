"use client";

import React from "react";
import { Trash2, Play, Rocket, Pencil, History, Activity, Globe, Clock, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FunctionDef } from "./types";

interface FunctionCardProps {
    fn: FunctionDef;
    deploying?: boolean;
    onDeploy: (id: string) => void;
    onInvoke: (fn: FunctionDef) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onViewDeployments: (id: string) => void;
    onViewInvocations: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
    deployed: "text-green-400 border-green-400/20 bg-green-400/10",
    draft: "text-neutral-400 border-neutral-400/20 bg-white/5",
    failed: "text-red-400 border-red-400/20 bg-red-400/10",
};

const TRIGGER_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    http: { label: "HTTP", cls: "text-blue-400 border-blue-400/20 bg-blue-400/10", icon: <Globe className="w-3 h-3" /> },
    cron: { label: "Cron", cls: "text-purple-400 border-purple-400/20 bg-purple-400/10", icon: <Clock className="w-3 h-3" /> },
    event: { label: "Event", cls: "text-amber-400 border-amber-400/20 bg-amber-400/10", icon: <Zap className="w-3 h-3" /> },
};

export function FunctionCard({
    fn, deploying, onDeploy, onInvoke, onEdit, onDelete, onViewDeployments, onViewInvocations,
}: FunctionCardProps) {
    const trigger = TRIGGER_META[fn.trigger_type] || TRIGGER_META.http;
    const statusCls = STATUS_STYLES[fn.status] || STATUS_STYLES.draft;
    const isDeployed = fn.status === "deployed";

    return (
        <Card className="bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-900/60 transition-all duration-300 flex flex-col group overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/5">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-4">
                        <CardTitle className="text-lg font-semibold text-white truncate flex items-center gap-2">
                            <span className="truncate font-mono">{fn.name}</span>
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${statusCls}`}>
                                {deploying ? <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin inline" /> : null}
                                {deploying ? "deploying" : fn.status}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${trigger.cls}`}>
                                {trigger.icon}{trigger.label}
                            </Badge>
                        </div>
                        <CardDescription className="text-neutral-400 text-sm mt-2 truncate">
                            {fn.description || "No description provided."}
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 transition-colors"
                        onClick={() => onDelete(fn.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="mt-auto pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-y-4 gap-x-4 bg-black/30 p-3.5 rounded-xl border border-white/5">
                    {fn.trigger_type === "cron" && (
                        <div className="flex flex-col gap-1.5 col-span-2 min-w-0">
                            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Schedule</span>
                            <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md w-fit border border-purple-400/20">
                                {fn.cron_expression}
                            </span>
                        </div>
                    )}
                    {fn.trigger_type === "event" && (
                        <div className="flex flex-col gap-1.5 col-span-2 min-w-0">
                            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Event</span>
                            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md w-fit border border-amber-400/20">
                                {fn.event_table} · {fn.event_op}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Version</span>
                        <span className="text-xs font-mono text-neutral-300">v{fn.version ?? 0}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Updated</span>
                        <span className="text-xs text-neutral-300 truncate">
                            {fn.updated_at ? new Date(fn.updated_at).toLocaleString() : "—"}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                        size="sm"
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white h-10 transition-colors"
                        onClick={() => onDeploy(fn.id)}
                        disabled={deploying}
                    >
                        {deploying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                        {isDeployed ? "Redeploy" : "Deploy"}
                    </Button>
                    <Button
                        variant="outline" size="sm"
                        className="w-full bg-transparent border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 h-10 transition-colors disabled:opacity-40"
                        onClick={() => onInvoke(fn)}
                        disabled={!isDeployed}
                    >
                        <Play className="w-4 h-4 mr-2 text-neutral-400" />
                        Invoke
                    </Button>
                    <Button
                        variant="outline" size="sm"
                        className="w-full bg-transparent border-primary-500/20 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 h-10 transition-colors"
                        onClick={() => onEdit(fn.id)}
                    >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline" size="sm"
                            className="w-full bg-transparent border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 h-10 px-0 transition-colors"
                            onClick={() => onViewDeployments(fn.id)}
                            title="Deployment history"
                        >
                            <History className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            className="w-full bg-transparent border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 h-10 px-0 transition-colors"
                            onClick={() => onViewInvocations(fn.id)}
                            title="Invocation logs"
                        >
                            <Activity className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
