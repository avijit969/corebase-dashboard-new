"use client";

import React from "react";
import { Activity, RefreshCw, CheckCircle2, XCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Invocation } from "./types";

interface InvocationsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invocations: Invocation[];
    loading: boolean;
    onRefresh: () => void;
}

const SOURCE_STYLES: Record<string, string> = {
    http: "text-blue-400 border-blue-400/20 bg-blue-400/10",
    cron: "text-purple-400 border-purple-400/20 bg-purple-400/10",
    event: "text-amber-400 border-amber-400/20 bg-amber-400/10",
};

export function InvocationsDialog({ open, onOpenChange, invocations, loading, onRefresh }: InvocationsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="shrink-0 p-6 border-b border-white/10 bg-black/20">
                    <DialogTitle className="text-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-500/10 rounded-lg">
                                <Activity className="w-5 h-5 text-primary-500" />
                            </div>
                            Invocation Logs
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" onClick={onRefresh}>
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto w-full p-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-20 w-full bg-white/5 rounded-xl border border-white/10" />
                            ))}
                        </div>
                    ) : invocations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center h-full max-w-sm mx-auto">
                            <div className="p-4 bg-white/5 rounded-full mb-6 ring-1 ring-inset ring-white/10">
                                <Activity className="w-10 h-10 text-neutral-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No Invocations Yet</h3>
                            <p className="text-neutral-400 text-sm">This function hasn't run yet. Invocations from HTTP, cron, and events will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invocations.map((inv) => (
                                <div key={inv.id} className="p-5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${inv.status === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                            {inv.status === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className="font-semibold text-white capitalize text-base">{inv.status}</span>
                                                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border capitalize ${SOURCE_STYLES[inv.trigger_source] || SOURCE_STYLES.http}`}>
                                                    {inv.trigger_source}
                                                </span>
                                                {inv.http_status != null && (
                                                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${inv.http_status >= 200 && inv.http_status < 300 ? "text-green-400 border-green-400/20 bg-green-400/10" : "text-red-400 border-red-400/20 bg-red-400/10"}`}>
                                                        {inv.http_status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                                <span>{new Date(inv.created_at).toLocaleString()}</span>
                                                {inv.duration_ms != null && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                                                        <span className="flex items-center"><Timer className="w-3 h-3 mr-1" /> {inv.duration_ms}ms</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {inv.error && (
                                        <div className="md:max-w-[40%] w-full bg-black/40 border border-white/5 rounded-lg p-3 overflow-hidden">
                                            <span className="text-xs font-mono text-red-300/80 block break-all line-clamp-3" title={inv.error}>
                                                {inv.error}
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
