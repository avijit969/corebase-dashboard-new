"use client";

import React from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { HardDrive, Plus, Trash2, RotateCcw, Globe, Lock, Loader2, ChevronRight } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CreateBucketDialog } from './CreateBucketDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Bucket {
    id: string; name: string; public: boolean; created_at: string;
}

interface Props {
    apiKey: string;
    selectedBucket: string | null;
    onSelectBucket: (name: string | null) => void;
    className?: string;
}

export function BucketSidebar({ apiKey, selectedBucket, onSelectBucket, className }: Props) {
    const queryClient = useQueryClient();

    const { data: buckets = [], isLoading } = useQuery<Bucket[]>({
        queryKey: ['storage-buckets', apiKey],
        queryFn: async () => {
            if (!apiKey) return [];
            const res = await api.storage.listBuckets(apiKey);
            return res.buckets || [];
        },
        enabled: !!apiKey,
    });

    const { mutate: deleteBucket } = useMutation({
        mutationFn: (name: string) => api.storage.deleteBucket(apiKey, name),
        onSuccess: (_, name) => {
            toast.success(`Bucket '${name}' deleted`);
            queryClient.invalidateQueries({ queryKey: ['storage-buckets', apiKey] });
            if (selectedBucket === name) onSelectBucket(null);
        },
        onError: (e: any) => toast.error(e.message || 'Failed to delete bucket'),
    });

    const { mutate: emptyBucket } = useMutation({
        mutationFn: (name: string) => api.storage.emptyBucket(apiKey, name),
        onSuccess: (_, name) => {
            toast.success(`Bucket '${name}' emptied`);
            queryClient.invalidateQueries({ queryKey: ['storage-files', name] });
        },
        onError: (e: any) => toast.error(e.message || 'Failed to empty bucket'),
    });

    const confirmDelete = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Delete bucket '${name}'? It must be empty.`)) return;
        deleteBucket(name);
    };

    const confirmEmpty = (name: string) => {
        if (!confirm(`Empty bucket '${name}'? All files will be permanently deleted.`)) return;
        emptyBucket(name);
    };

    return (
        <div className={cn('w-64 flex flex-col h-full border-r border-white/6 bg-[#09090f]', className)}>
            {/* header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-neutral-500" />
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Storage</span>
                </div>
                <CreateBucketDialog apiKey={apiKey}>
                    <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/6">
                        <Plus className="w-3.5 h-3.5" />
                        New
                    </button>
                </CreateBucketDialog>
            </div>

            {/* bucket list */}
            <div className="flex-1 overflow-y-auto py-2">
                {isLoading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" />
                    </div>
                ) : buckets.length === 0 ? (
                    <div className="px-4 py-8 flex flex-col items-center gap-3 text-center">
                        <div className="w-10 h-10 rounded-full bg-white/4 flex items-center justify-center">
                            <HardDrive className="w-5 h-5 text-neutral-700" />
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed">
                            No buckets yet.<br />Create one to start storing files.
                        </p>
                        <CreateBucketDialog apiKey={apiKey}>
                            <button className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">
                                Create bucket →
                            </button>
                        </CreateBucketDialog>
                    </div>
                ) : (
                    buckets.map((bucket) => {
                        const isSelected = selectedBucket === bucket.name;
                        return (
                            <div
                                key={bucket.name}
                                onClick={() => onSelectBucket(bucket.name)}
                                className={cn(
                                    'group flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-100',
                                    isSelected
                                        ? 'bg-primary-500/12 border border-primary-500/25'
                                        : 'border border-transparent hover:bg-white/4 hover:border-white/6',
                                )}
                            >
                                {/* access icon */}
                                <div className={cn(
                                    'w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors',
                                    isSelected ? 'bg-primary-500/20' : 'bg-white/5 group-hover:bg-white/8',
                                )}>
                                    {bucket.public
                                        ? <Globe className={cn('w-3 h-3', isSelected ? 'text-primary-400' : 'text-neutral-500')} />
                                        : <Lock className={cn('w-3 h-3', isSelected ? 'text-primary-400' : 'text-neutral-600')} />
                                    }
                                </div>

                                {/* name */}
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        'text-sm font-mono truncate transition-colors',
                                        isSelected ? 'text-primary-300' : 'text-neutral-400 group-hover:text-neutral-200',
                                    )}>
                                        {bucket.name}
                                    </p>
                                    <p className="text-[10px] text-neutral-700">
                                        {bucket.public ? 'Public' : 'Private'}
                                    </p>
                                </div>

                                {/* actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            onClick={e => e.stopPropagation()}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-neutral-600 hover:text-neutral-300 transition-all shrink-0"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                                            </svg>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-neutral-900 border-white/10 text-white text-sm min-w-[160px]">
                                        <DropdownMenuItem
                                            onClick={() => confirmEmpty(bucket.name)}
                                            className="gap-2 text-neutral-300 focus:text-white"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" /> Empty bucket
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-white/8" />
                                        <DropdownMenuItem
                                            onClick={e => confirmDelete(bucket.name, e as any)}
                                            className="gap-2 text-red-400 focus:text-red-300 focus:bg-red-900/20"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete bucket
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        );
                    })
                )}
            </div>

            {/* footer */}
            {buckets.length > 0 && (
                <div className="px-4 py-3 border-t border-white/5">
                    <p className="text-[10px] text-neutral-700 tabular-nums">
                        {buckets.length} bucket{buckets.length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
}
