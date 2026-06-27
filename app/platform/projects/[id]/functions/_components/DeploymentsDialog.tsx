"use client";

import React from "react";
import { History, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Deployment } from "./types";

interface DeploymentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deployments: Deployment[];
    loading: boolean;
    onRefresh: () => void;
}

export function DeploymentsDialog({ open, onOpenChange, deployments, loading, onRefresh }: DeploymentsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="shrink-0 p-6 border-b border-white/10 bg-black/20">
                    <DialogTitle className="text-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-500/10 rounded-lg">
                                <History className="w-5 h-5 text-primary-500" />
                            </div>
                            Deployment History
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" onClick={onRefresh}>
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto w-full p-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-20 w-full bg-white/5 rounded-xl border border-white/10" />
                            ))}
                        </div>
                    ) : deployments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center h-full max-w-sm mx-auto">
                            <div className="p-4 bg-white/5 rounded-full mb-6 ring-1 ring-inset ring-white/10">
                                <History className="w-10 h-10 text-neutral-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No Deployments Yet</h3>
                            <p className="text-neutral-400 text-sm">Deploy this function to see its deployment history here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {deployments.map((dep) => (
                                <div key={dep.id} className="p-5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${dep.status === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                            {dep.status === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className="font-semibold text-white capitalize text-base">{dep.status}</span>
                                                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border text-neutral-300 border-white/10 bg-white/5">v{dep.version}</span>
                                            </div>
                                            <div className="text-sm text-neutral-500">{new Date(dep.created_at).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    {dep.cf_errors && (
                                        <div className="md:max-w-[45%] w-full bg-black/40 border border-white/5 rounded-lg p-3 overflow-hidden">
                                            <span className="text-xs font-mono text-red-300/80 block break-all line-clamp-4" title={dep.cf_errors}>
                                                {dep.cf_errors}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
