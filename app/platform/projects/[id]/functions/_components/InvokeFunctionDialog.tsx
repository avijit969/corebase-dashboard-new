"use client";

import React, { useState, useEffect } from "react";
import { Play, Loader2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CodeView } from "@/components/ui/code-view";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { FunctionDef } from "./types";

interface InvokeFunctionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fn: FunctionDef | null;
    apiKey: string | null;
}

interface InvokeResult {
    status_code: number;
    ok: boolean;
    duration_ms?: number;
    body: string;
}

export function InvokeFunctionDialog({ open, onOpenChange, fn, apiKey }: InvokeFunctionDialogProps) {
    const [method, setMethod] = useState("POST");
    const [body, setBody] = useState("{}");
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<InvokeResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setResult(null);
            setError(null);
        }
    }, [open, fn?.id]);

    const hasBody = method !== "GET" && method !== "HEAD";

    const handleRun = async () => {
        if (!apiKey || !fn) return;

        let parsedBody: any = undefined;
        if (hasBody && body.trim()) {
            try {
                parsedBody = JSON.parse(body);
            } catch {
                toast.error("Request body is not valid JSON");
                return;
            }
        }

        setRunning(true);
        setResult(null);
        setError(null);
        try {
            const res = await api.functions.invoke(apiKey, fn.name, { method, body: parsedBody });
            setResult(res);
        } catch (e: any) {
            setError(e.message || "Invocation failed");
        } finally {
            setRunning(false);
        }
    };

    const prettyBody = (raw: string): string => {
        try {
            return JSON.stringify(JSON.parse(raw), null, 2);
        } catch {
            return raw;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="shrink-0 p-6 border-b border-white/10 bg-black/20">
                    <DialogTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 bg-primary-500/10 rounded-lg">
                            <Play className="w-5 h-5 text-primary-500" />
                        </div>
                        <span>Invoke <span className="font-mono text-primary-400">{fn?.name}</span></span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto w-full p-6 space-y-5">
                    <div className="flex gap-3 items-end">
                        <div className="space-y-2 w-32">
                            <Label>Method</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger className="bg-black/50 border-white/10 text-white w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleRun}
                            disabled={running}
                            className="bg-primary-600 hover:bg-primary-500 text-white flex-1 h-10"
                        >
                            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                            {running ? "Running..." : "Run"}
                        </Button>
                    </div>

                    {hasBody && (
                        <div className="space-y-2">
                            <Label>Request Body (JSON)</Label>
                            <Textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder={'{ "key": "value" }'}
                                className="bg-black/50 border-white/10 text-white font-mono h-28 resize-none focus-visible:ring-primary-500"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm break-words">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Response</span>
                                <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${result.ok ? "text-green-400 border-green-400/20 bg-green-400/10" : "text-red-400 border-red-400/20 bg-red-400/10"}`}>
                                    {result.status_code}
                                </span>
                                {result.duration_ms !== undefined && (
                                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                                        <Timer className="w-3 h-3" /> {result.duration_ms}ms
                                    </span>
                                )}
                            </div>
                            {result.body ? (
                                <CodeView code={prettyBody(result.body)} language="json" title="Body" />
                            ) : (
                                <p className="text-sm text-neutral-500 italic">Empty response body.</p>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
