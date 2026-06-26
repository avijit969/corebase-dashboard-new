"use client";

import React, { useState } from "react";
import { Plus, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetDescription
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useApiKey } from "@/lib/stores/project-store";

interface CreateCronJobSheetProps {
    onSuccess: () => void;
}

export function CreateCronJobSheet({ onSuccess }: CreateCronJobSheetProps) {
    const apiKey = useApiKey();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [examplesOpen, setExamplesOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        cron_expression: "0 * * * *",
        url: "",
        method: "POST",
        headers: "{}",
        body: "{}",
        max_retry_count: 3,
        timeout_ms: 10000,
        is_active: true,
    });

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey) return;

        setIsSubmitting(true);
        try {
            await api.cron.create(apiKey, {
                ...formData,
                max_retry_count: Number(formData.max_retry_count),
                timeout_ms: Number(formData.timeout_ms),
            });
            toast.success("Cron job created successfully");
            setOpen(false);
            setFormData({
                name: "",
                description: "",
                cron_expression: "0 * * * *",
                url: "",
                method: "POST",
                headers: "{}",
                body: "{}",
                max_retry_count: 3,
                timeout_ms: 10000,
                is_active: true,
            });
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to create cron job");
        } finally {
            setIsSubmitting(false);
        }
    };

    const applyCronExample = (expr: string) => {
        setFormData({ ...formData, cron_expression: expr });
        setExamplesOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Job
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-neutral-900 border-white/10 text-white sm:max-w-2xl w-full overflow-y-auto p-4">
                <SheetHeader>
                    <SheetTitle className="text-xl flex items-center gap-2 text-white">
                        <Clock className="w-5 h-5 text-primary-500" />
                        Create Cron Job
                    </SheetTitle>
                    <SheetDescription className="text-neutral-400">
                        Configure a new scheduled task to run automatically.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleCreateJob} className="space-y-6 mt-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Job Name</Label>
                                <Input required placeholder="Nightly Sync" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Cron Expression</Label>
                                    <Dialog open={examplesOpen} onOpenChange={setExamplesOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 text-xs font-normal">
                                                <Info className="w-3.5 h-3.5 mr-1" />
                                                Examples
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl flex items-center gap-2">
                                                    <Clock className="w-5 h-5 text-primary-500" />
                                                    Cron Examples
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 mt-2">
                                                <p className="text-neutral-400 text-sm">Select an example to apply it to your cron job.</p>
                                                <div className="space-y-2 text-sm">
                                                    {[
                                                        { label: "Every 5 minutes",        expr: "*/5 * * * *" },
                                                        { label: "Every hour",             expr: "0 * * * *"   },
                                                        { label: "Every day at midnight",  expr: "0 0 * * *"   },
                                                        { label: "Every Sunday at midnight", expr: "0 0 * * 0" },
                                                        { label: "Weekdays at 9:00 AM",    expr: "0 9 * * 1-5" },
                                                    ].map(({ label, expr }) => (
                                                        <div key={expr} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 hover:border-white/20 hover:bg-white/5 cursor-pointer transition-all" onClick={() => applyCronExample(expr)}>
                                                            <span className="font-medium text-white">{label}</span>
                                                            <code className="text-primary-400 font-mono bg-primary-500/10 px-2 py-1 rounded-md border border-primary-500/20">{expr}</code>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Input required placeholder="0 0 * * *" value={formData.cron_expression} onChange={e => setFormData({ ...formData, cron_expression: e.target.value })} className="bg-black/50 border-white/10 text-white font-mono focus-visible:ring-primary-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Input placeholder="Synchronize user data..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary-500" />
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label>Method</Label>
                                <Select value={formData.method} onValueChange={val => setFormData({ ...formData, method: val })}>
                                    <SelectTrigger className="bg-black/50 border-white/10 text-white w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 col-span-3">
                                <Label>Target URL</Label>
                                <Input required type="url" placeholder="https://api.example.com/sync" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} className="bg-black/50 border-white/10 text-white font-mono focus-visible:ring-primary-500" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Headers (JSON)</Label>
                            <Textarea placeholder={'{"Authorization": "Bearer token"}'} value={formData.headers} onChange={e => setFormData({ ...formData, headers: e.target.value })} className="bg-black/50 border-white/10 text-white font-mono h-20 resize-none focus-visible:ring-primary-500" />
                        </div>

                        {formData.method !== "GET" && (
                            <div className="space-y-2">
                                <Label>Body (JSON)</Label>
                                <Textarea placeholder={'{"action": "sync"}'} value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} className="bg-black/50 border-white/10 text-white font-mono h-24 resize-none focus-visible:ring-primary-500" />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Max Retries</Label>
                                <Input type="number" min={0} max={10} value={formData.max_retry_count} onChange={e => setFormData({ ...formData, max_retry_count: Number(e.target.value) })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary-500" />
                            </div>
                            <div className="space-y-2">
                                <Label>Timeout (ms)</Label>
                                <Input type="number" min={1000} max={60000} value={formData.timeout_ms} onChange={e => setFormData({ ...formData, timeout_ms: Number(e.target.value) })} className="bg-black/50 border-white/10 text-white focus-visible:ring-primary-500" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mt-2">
                            <div className="space-y-1">
                                <Label className="text-base text-white">Active Status</Label>
                                <p className="text-sm text-neutral-400">Enable or disable this job from running automatically.</p>
                            </div>
                            <Switch checked={formData.is_active} onCheckedChange={val => setFormData({ ...formData, is_active: val })} className="data-[state=checked]:bg-primary-500" />
                        </div>
                    </div>

                    <SheetFooter className="pt-6 mt-6 border-t border-white/10 sm:justify-end">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="hover:text-white hover:bg-white/10">Cancel</Button>
                        <Button type="submit" className="bg-primary-600 hover:bg-primary-500 shadow-md shadow-primary-900/20" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Job"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
