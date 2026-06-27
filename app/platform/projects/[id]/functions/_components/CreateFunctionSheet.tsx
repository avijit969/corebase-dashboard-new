"use client";

import React, { useState, useEffect } from "react";
import { Plus, Code, Loader2, Rocket } from "lucide-react";
import { Editor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetDescription,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useApiKey } from "@/lib/stores/project-store";
import { TriggerType } from "./types";

const DEFAULT_CODE = `export default {
  async fetch(request, env, ctx) {
    return new Response(JSON.stringify({ message: "Hello from your function!" }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
`;

interface CreateFunctionSheetProps {
    onSuccess: () => void;
    mode?: "create" | "edit";
    functionId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const emptyForm = {
    name: "",
    description: "",
    trigger_type: "http" as TriggerType,
    cron_expression: "0 * * * *",
    event_table: "",
    event_op: "insert",
    code: DEFAULT_CODE,
};

export function CreateFunctionSheet({ onSuccess, mode = "create", functionId, open, onOpenChange }: CreateFunctionSheetProps) {
    const apiKey = useApiKey();
    const isEdit = mode === "edit";
    const isControlled = open !== undefined;

    const [internalOpen, setInternalOpen] = useState(false);
    const sheetOpen = isControlled ? !!open : internalOpen;
    const setSheetOpen = (v: boolean) => (isControlled ? onOpenChange?.(v) : setInternalOpen(v));

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ ...emptyForm });

    // Load the function when opening the edit sheet.
    useEffect(() => {
        if (!isEdit || !sheetOpen || !functionId || !apiKey) return;
        let active = true;
        (async () => {
            setLoading(true);
            try {
                const res = await api.functions.get(apiKey, functionId);
                const fn = res.function || res;
                if (!active) return;
                setForm({
                    name: fn.name ?? "",
                    description: fn.description ?? "",
                    trigger_type: (fn.trigger_type ?? "http") as TriggerType,
                    cron_expression: fn.cron_expression ?? "0 * * * *",
                    event_table: fn.event_table ?? "",
                    event_op: fn.event_op ?? "insert",
                    code: fn.code ?? DEFAULT_CODE,
                });
            } catch (e: any) {
                toast.error(e.message || "Failed to load function");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [isEdit, sheetOpen, functionId, apiKey]);

    const resetForm = () => setForm({ ...emptyForm });

    const validate = (): string | null => {
        if (!isEdit) {
            if (!/^[a-zA-Z0-9_-]{1,40}$/.test(form.name.trim())) {
                return "Name must be 1-40 chars: letters, numbers, _ or -";
            }
        }
        if (form.trigger_type === "cron" && !form.cron_expression.trim()) {
            return "A cron expression is required for cron functions";
        }
        if (form.trigger_type === "event" && !form.event_table.trim()) {
            return "An event table is required for event functions";
        }
        if (!form.code.trim()) return "Function code cannot be empty";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey) return;

        const err = validate();
        if (err) { toast.error(err); return; }

        setIsSubmitting(true);
        try {
            if (isEdit) {
                const patch: any = { description: form.description, code: form.code };
                if (form.trigger_type === "cron") patch.cron_expression = form.cron_expression;
                if (form.trigger_type === "event") {
                    patch.event_table = form.event_table;
                    patch.event_op = form.event_op;
                }
                await api.functions.update(apiKey, functionId!, patch);
            } else {
                const payload: any = {
                    name: form.name.trim(),
                    description: form.description,
                    code: form.code,
                    trigger_type: form.trigger_type,
                };
                if (form.trigger_type === "cron") payload.cron_expression = form.cron_expression;
                if (form.trigger_type === "event") {
                    payload.event_table = form.event_table;
                    payload.event_op = form.event_op;
                }
                await api.functions.create(apiKey, payload);
            }

            toast.success(isEdit ? "Function saved" : "Function created");

            setSheetOpen(false);
            if (!isEdit) resetForm();
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to save function");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = "bg-black/50 border-white/10 text-white focus-visible:ring-primary-500";

    const content = (
        <SheetContent className="bg-neutral-900 border-white/10 text-white sm:max-w-2xl w-full overflow-y-auto p-4">
            <SheetHeader>
                <SheetTitle className="text-xl flex items-center gap-2 text-white">
                    <Code className="w-5 h-5 text-primary-500" />
                    {isEdit ? "Edit Function" : "Create Function"}
                </SheetTitle>
                <SheetDescription className="text-neutral-400">
                    {isEdit
                        ? "Update your function's code and configuration, then re-deploy."
                        : "Write a serverless function and deploy it to the edge."}
                </SheetDescription>
            </SheetHeader>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-neutral-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Function Name</Label>
                            <Input
                                required
                                placeholder="send-email"
                                value={form.name}
                                disabled={isEdit}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className={`${inputCls} ${isEdit ? "opacity-60" : ""} font-mono`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Trigger</Label>
                            <Select
                                value={form.trigger_type}
                                onValueChange={(val) => setForm({ ...form, trigger_type: val as TriggerType })}
                            >
                                <SelectTrigger className={`${inputCls} w-full ${isEdit ? "opacity-60 pointer-events-none" : ""}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                    <SelectItem value="http">HTTP</SelectItem>
                                    <SelectItem value="cron">Cron</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Input
                            placeholder="Sends a transactional email"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className={inputCls}
                        />
                    </div>

                    {form.trigger_type === "cron" && (
                        <div className="space-y-2">
                            <Label>Cron Expression</Label>
                            <Input
                                placeholder="0 * * * *"
                                value={form.cron_expression}
                                onChange={(e) => setForm({ ...form, cron_expression: e.target.value })}
                                className={`${inputCls} font-mono`}
                            />
                            <p className="text-xs text-neutral-500">Runs on the platform schedule (UTC), evaluated every minute.</p>
                        </div>
                    )}

                    {form.trigger_type === "event" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Event Table</Label>
                                <Input
                                    placeholder="auth_users"
                                    value={form.event_table}
                                    onChange={(e) => setForm({ ...form, event_table: e.target.value })}
                                    className={`${inputCls} font-mono`}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Event</Label>
                                <Select value={form.event_op} onValueChange={(val) => setForm({ ...form, event_op: val })}>
                                    <SelectTrigger className={`${inputCls} w-full`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                        <SelectItem value="insert">Row insert</SelectItem>
                                        <SelectItem value="update">Row update</SelectItem>
                                        <SelectItem value="delete">Row delete</SelectItem>
                                        <SelectItem value="auth.signup">Auth signup</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Code</Label>
                        <div className="h-[360px] bg-black/60 border border-white/10 rounded-xl overflow-hidden">
                            <Editor
                                path={`function-${functionId || "new"}.js`}
                                height="100%"
                                defaultLanguage="javascript"
                                theme="vs-dark"
                                value={form.code}
                                onChange={(val) => setForm({ ...form, code: val || "" })}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    padding: { top: 20 },
                                    scrollBeyondLastLine: false,
                                    smoothScrolling: true,
                                    wordWrap: "on",
                                }}
                            />
                        </div>
                        <p className="text-xs text-neutral-500">
                            Standard ES module: <code className="text-primary-400/80">export default {"{ async fetch(request, env, ctx) {} }"}</code>
                        </p>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <Rocket className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                            <Label className="text-sm text-amber-300">Deployment coming soon</Label>
                            <p className="text-xs text-neutral-400">Save your function now — live edge deployment will be available shortly.</p>
                        </div>
                    </div>

                    <SheetFooter className="pt-6 mt-6 border-t border-white/10 sm:justify-end">
                        <Button type="button" variant="ghost" onClick={() => setSheetOpen(false)} className="hover:text-white hover:bg-white/10">
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-primary-600 hover:bg-primary-500 shadow-md shadow-primary-900/20" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isSubmitting ? "Saving..." : (isEdit ? "Save Changes" : "Create Function")}
                        </Button>
                    </SheetFooter>
                </form>
            )}
        </SheetContent>
    );

    if (isControlled) {
        return (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                {content}
            </Sheet>
        );
    }

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <Button className="bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Function
                </Button>
            </SheetTrigger>
            {content}
        </Sheet>
    );
}
