"use client";

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
    File, FileImage, FileText, FileAudio, FileVideo, FileCode,
    Trash2, Copy, UploadCloud, Loader2, FolderOpen, Menu, BookOpen,
    LayoutGrid, List, X, ExternalLink, Check,
} from 'lucide-react';
import { StorageDocsSheet } from './StorageDocsSheet';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── helpers ────────────────────────────────────────────────────────────────

type FileCategory = 'image' | 'video' | 'audio' | 'text' | 'document' | 'other';

function category(mime: string): FileCategory {
    if (!mime) return 'other';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('text/') || mime.includes('json') || mime.includes('xml') || mime.includes('javascript')) return 'text';
    if (mime.includes('pdf') || mime.includes('document') || mime.includes('spreadsheet') || mime.includes('presentation')) return 'document';
    return 'other';
}

const TYPE_STYLES: Record<FileCategory, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    image:    { icon: FileImage, color: 'text-sky-400',     bg: 'bg-sky-500/10',     label: 'Image'    },
    video:    { icon: FileVideo, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Video'    },
    audio:    { icon: FileAudio, color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Audio'    },
    text:     { icon: FileCode,  color: 'text-violet-400',  bg: 'bg-violet-500/10',  label: 'Code'     },
    document: { icon: FileText,  color: 'text-orange-400',  bg: 'bg-orange-500/10',  label: 'Document' },
    other:    { icon: File,      color: 'text-neutral-400', bg: 'bg-neutral-500/10', label: 'File'     },
};

function formatBytes(n: number) {
    if (!n) return '0 B';
    if (n < 1024) return `${n} B`;
    if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
    return `${(n / 1073741824).toFixed(2)} GB`;
}

function formatDate(s: string) {
    const d = new Date(s);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── types ───────────────────────────────────────────────────────────────────

interface StorageFile {
    id: string; key: string; bucket: string;
    filename: string; mime_type: string;
    size: number; url?: string; created_at: string;
}

interface Props {
    apiKey: string;
    bucketName: string | null;
    onToggleSidebar?: () => void;
}

// ─── component ───────────────────────────────────────────────────────────────

export function FileBrowser({ apiKey, bucketName, onToggleSidebar }: Props) {
    const [dragActive, setDragActive] = useState(false);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [selected, setSelected] = useState<StorageFile | null>(null);
    const [openDocs, setOpenDocs] = useState(false);
    const [copied, setCopied] = useState(false);

    const queryClient = useQueryClient();

    const { data: files = [], isLoading } = useQuery<StorageFile[]>({
        queryKey: ['storage-files', bucketName],
        queryFn: async () => {
            if (!bucketName || !apiKey) return [];
            const res = await api.storage.listFiles(apiKey, bucketName);
            return Array.isArray(res) ? res : (res.files || []);
        },
        enabled: !!bucketName && !!apiKey,
    });

    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

    const { mutate: uploadFiles, isPending: isUploading } = useMutation({
        mutationFn: async (fileList: FileList) => {
            if (!bucketName) return;
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                const signRes = await api.storage.getUploadUrl(apiKey, {
                    bucketName, filename: file.name,
                    contentType: file.type || 'application/octet-stream', size: file.size,
                });
                if (!signRes.uploadUrl) throw new Error(`Failed to get upload URL for ${file.name}`);
                const up = await fetch(signRes.uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-api-key': apiKey },
                    body: file,
                });
                if (!up.ok) throw new Error(`Upload failed for ${file.name}`);
            }
        },
        onSuccess: () => {
            toast.success('Files uploaded');
            queryClient.invalidateQueries({ queryKey: ['storage-files', bucketName] });
        },
        onError: (e: any) => toast.error(e.message || 'Upload failed'),
    });

    const { mutate: deleteFile } = useMutation({
        mutationFn: (id: string) => api.storage.deleteFile(apiKey, id),
        onSuccess: (_, id) => {
            toast.success('File deleted');
            queryClient.invalidateQueries({ queryKey: ['storage-files', bucketName] });
            if (selected?.id === id) setSelected(null);
        },
        onError: () => toast.error('Failed to delete file'),
    });

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (!bucketName) { toast.error('Select a bucket first'); return; }
        if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('URL copied');
        setTimeout(() => setCopied(false), 2000);
    };

    // ── empty / no bucket ──────────────────────────────────────────────────

    if (!bucketName) return (
        <div className="flex-1 flex flex-col h-full">
            <div className="md:hidden flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <button onClick={onToggleSidebar} className="text-neutral-400 hover:text-white transition-colors">
                    <Menu className="w-5 h-5" />
                </button>
                <span className="font-medium text-sm text-neutral-300">Storage</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-neutral-600 m-6 rounded-xl border border-dashed border-white/5">
                <FolderOpen className="w-12 h-12 opacity-20" />
                <p className="text-sm">Select a bucket to browse files</p>
            </div>
        </div>
    );

    // ── main ──────────────────────────────────────────────────────────────

    return (
        <div
            className="flex-1 flex flex-col h-full relative select-none"
            onDragEnter={handleDrag} onDragLeave={handleDrag}
            onDragOver={handleDrag} onDrop={handleDrop}
        >
            {/* ── drag overlay ── */}
            {dragActive && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3
                    bg-primary-950/60 border-2 border-primary-500/60 border-dashed backdrop-blur-sm rounded-none
                    transition-all duration-150">
                    <UploadCloud className="w-14 h-14 text-primary-400 animate-pulse" />
                    <p className="text-primary-300 font-medium text-lg">Drop to upload</p>
                </div>
            )}

            {/* ── header ── */}
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onToggleSidebar}
                        className="md:hidden text-neutral-500 hover:text-white transition-colors shrink-0"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-neutral-500 text-sm font-mono">/</span>
                        <span className="text-sm font-semibold text-white truncate font-mono">{bucketName}</span>
                    </div>
                    {!isLoading && (
                        <span className="hidden sm:inline text-xs text-neutral-600 font-mono tabular-nums">
                            {files.length} {files.length === 1 ? 'file' : 'files'}
                            {totalSize > 0 && <> &middot; {formatBytes(totalSize)}</>}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-white/5 rounded-lg p-0.5 gap-0.5">
                        <button
                            onClick={() => setView('grid')}
                            className={cn('p-1.5 rounded-md transition-colors', view === 'grid' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300')}
                        ><LayoutGrid className="w-3.5 h-3.5" /></button>
                        <button
                            onClick={() => setView('list')}
                            className={cn('p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300')}
                        ><List className="w-3.5 h-3.5" /></button>
                    </div>

                    <button
                        onClick={() => setOpenDocs(true)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors rounded-md hover:bg-white/5"
                        title="API Docs"
                    ><BookOpen className="w-4 h-4" /></button>

                    <label className="cursor-pointer">
                        <div className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                            isUploading
                                ? 'bg-primary-600/30 text-primary-400 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-500 text-white',
                        )}>
                            {isUploading
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                                : <><UploadCloud className="w-3.5 h-3.5" /> Upload</>
                            }
                        </div>
                        <input
                            type="file" multiple className="hidden"
                            onChange={e => e.target.files && uploadFiles(e.target.files)}
                            disabled={isUploading}
                        />
                    </label>
                </div>
            </div>

            {/* ── body ── */}
            <div className="flex flex-1 min-h-0">
                {/* file list / grid */}
                <div className="flex-1 overflow-y-auto p-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                        </div>
                    ) : files.length === 0 ? (
                        <EmptyState onUpload={fs => uploadFiles(fs)} isUploading={isUploading} />
                    ) : view === 'grid' ? (
                        <GridView
                            files={files} selected={selected}
                            onSelect={setSelected}
                            onDelete={id => deleteFile(id)}
                            onCopy={url => copyUrl(url)}
                        />
                    ) : (
                        <ListView
                            files={files} selected={selected}
                            onSelect={setSelected}
                            onDelete={id => deleteFile(id)}
                            onCopy={url => copyUrl(url)}
                        />
                    )}
                </div>

                {/* detail panel */}
                {selected && (
                    <DetailPanel
                        file={selected}
                        onClose={() => setSelected(null)}
                        onDelete={() => deleteFile(selected.id)}
                        onCopy={() => copyUrl(selected.url!)}
                        copied={copied}
                    />
                )}
            </div>

            <StorageDocsSheet open={openDocs} onOpenChange={setOpenDocs} bucketName={bucketName} />
        </div>
    );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function EmptyState({ onUpload, isUploading }: { onUpload: (f: FileList) => void; isUploading: boolean }) {
    return (
        <label className="flex flex-col items-center justify-center h-64 gap-4 border-2 border-dashed border-white/8 rounded-xl cursor-pointer hover:border-white/15 hover:bg-white/2 transition-all duration-200 group">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                <UploadCloud className="w-7 h-7 text-neutral-600 group-hover:text-primary-400 transition-colors" />
            </div>
            <div className="text-center">
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                    Drop files here or <span className="text-primary-400 font-medium">browse</span>
                </p>
                <p className="text-xs text-neutral-600 mt-1">Any file type accepted</p>
            </div>
            <input type="file" multiple className="hidden"
                onChange={e => e.target.files && onUpload(e.target.files)} disabled={isUploading} />
        </label>
    );
}

interface FileActionsProps {
    selected: StorageFile | null;
    onSelect: (f: StorageFile) => void;
    onDelete: (id: string) => void;
    onCopy: (url: string) => void;
}

function GridView({ files, selected, onSelect, onDelete, onCopy }: FileActionsProps & { files: StorageFile[] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {files.map(file => (
                <GridCard
                    key={file.id} file={file}
                    isSelected={selected?.id === file.id}
                    onClick={() => onSelect(file)}
                    onDelete={onDelete} onCopy={onCopy}
                />
            ))}
        </div>
    );
}

function GridCard({ file, isSelected, onClick, onDelete, onCopy }: {
    file: StorageFile; isSelected: boolean;
    onClick: () => void; onDelete: (id: string) => void; onCopy: (url: string) => void;
}) {
    const cat = category(file.mime_type);
    const type = TYPE_STYLES[cat];
    const Icon = type.icon;
    const isImage = cat === 'image';

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-150',
                'border bg-[#111120]',
                isSelected
                    ? 'border-primary-500/50 shadow-[0_0_0_1px_rgba(124,58,237,0.3)]'
                    : 'border-white/6 hover:border-white/14',
            )}
        >
            {/* preview */}
            <div className={cn('relative aspect-square flex items-center justify-center overflow-hidden', type.bg)}>
                {isImage && file.url ? (
                    <img
                        src={file.url} alt={file.filename}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <Icon className={cn('w-10 h-10', type.color)} />
                )}

                {/* hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2">
                    {file.url && (
                        <button
                            onClick={e => { e.stopPropagation(); onCopy(file.url!); }}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
                            title="Copy URL"
                        ><Copy className="w-3.5 h-3.5" /></button>
                    )}
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(file.id); }}
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 backdrop-blur-sm transition-colors"
                        title="Delete"
                    ><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </div>

            {/* meta */}
            <div className="px-2.5 py-2 bg-[#0d0d1a]">
                <p className="text-xs font-mono text-neutral-300 truncate" title={file.filename}>
                    {file.filename}
                </p>
                <p className="text-[10px] text-neutral-600 tabular-nums mt-0.5">
                    {formatBytes(file.size)}
                </p>
            </div>
        </div>
    );
}

function ListView({ files, selected, onSelect, onDelete, onCopy }: FileActionsProps & { files: StorageFile[] }) {
    return (
        <div className="rounded-xl border border-white/6 overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/6 bg-[#0a0a15]">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider w-8"></th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">Size</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Uploaded</th>
                        <th className="w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                    {files.map(file => {
                        const cat = category(file.mime_type);
                        const type = TYPE_STYLES[cat];
                        const Icon = type.icon;
                        return (
                            <tr
                                key={file.id}
                                onClick={() => onSelect(file)}
                                className={cn(
                                    'cursor-pointer transition-colors duration-100 group',
                                    selected?.id === file.id
                                        ? 'bg-primary-500/8'
                                        : 'hover:bg-white/3',
                                )}
                            >
                                <td className="px-4 py-3">
                                    <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', type.bg)}>
                                        <Icon className={cn('w-3.5 h-3.5', type.color)} />
                                    </div>
                                </td>
                                <td className="px-4 py-3 max-w-[200px]">
                                    <span className="font-mono text-neutral-200 text-xs truncate block" title={file.filename}>
                                        {file.filename}
                                    </span>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', type.bg, type.color)}>
                                        {type.label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right hidden md:table-cell text-xs text-neutral-500 tabular-nums font-mono">
                                    {formatBytes(file.size)}
                                </td>
                                <td className="px-4 py-3 text-right hidden lg:table-cell text-xs text-neutral-600 tabular-nums">
                                    {file.created_at ? formatDate(file.created_at) : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                onClick={e => e.stopPropagation()}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-neutral-400 transition-all"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                                                </svg>
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-neutral-900 border-white/10 text-white text-sm">
                                            {file.url && (
                                                <DropdownMenuItem onClick={() => onCopy(file.url!)}>
                                                    <Copy className="w-3.5 h-3.5 mr-2" /> Copy URL
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator className="bg-white/8" />
                                            <DropdownMenuItem
                                                onClick={() => onDelete(file.id)}
                                                className="text-red-400 focus:text-red-300 focus:bg-red-900/20"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function DetailPanel({ file, onClose, onDelete, onCopy, copied }: {
    file: StorageFile; onClose: () => void;
    onDelete: () => void; onCopy: () => void; copied: boolean;
}) {
    const cat = category(file.mime_type);
    const type = TYPE_STYLES[cat];
    const Icon = type.icon;
    const isImage = cat === 'image';
    const isAudio = cat === 'audio';
    const isVideo = cat === 'video';

    return (
        <div className="w-72 shrink-0 border-l border-white/6 bg-[#0a0a15] flex flex-col h-full overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Details</span>
                <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors p-0.5 rounded">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* preview */}
            <div className={cn('w-full aspect-video flex items-center justify-center overflow-hidden shrink-0', type.bg)}>
                {isImage && file.url ? (
                    <img src={file.url} alt={file.filename} className="w-full h-full object-contain" />
                ) : isAudio && file.url ? (
                    <div className="flex flex-col items-center gap-3 p-4 w-full">
                        <Icon className={cn('w-12 h-12', type.color)} />
                        <audio controls className="w-full h-8" src={file.url} />
                    </div>
                ) : isVideo && file.url ? (
                    <video controls className="w-full h-full object-contain" src={file.url} />
                ) : (
                    <Icon className={cn('w-14 h-14', type.color)} />
                )}
            </div>

            {/* meta */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                    <p className="text-xs text-neutral-500 mb-1">Filename</p>
                    <p className="text-sm font-mono text-neutral-200 break-all">{file.filename}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-neutral-500 mb-1">Size</p>
                        <p className="text-sm text-neutral-300 tabular-nums font-mono">{formatBytes(file.size)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 mb-1">Type</p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', type.bg, type.color)}>
                            {type.label}
                        </span>
                    </div>
                </div>

                {file.created_at && (
                    <div>
                        <p className="text-xs text-neutral-500 mb-1">Uploaded</p>
                        <p className="text-sm text-neutral-400">{formatDate(file.created_at)}</p>
                    </div>
                )}

                {file.url && (
                    <div>
                        <p className="text-xs text-neutral-500 mb-1">Public URL</p>
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/4 border border-white/6">
                            <p className="text-xs font-mono text-neutral-400 truncate flex-1">{file.url}</p>
                            {file.url && (
                                <a
                                    href={file.url} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
                                ><ExternalLink className="w-3.5 h-3.5" /></a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* actions */}
            <div className="p-4 border-t border-white/5 flex flex-col gap-2 shrink-0">
                {file.url && (
                    <button
                        onClick={onCopy}
                        className={cn(
                            'flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            copied
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-white/6 hover:bg-white/10 text-neutral-300',
                        )}
                    >
                        {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy URL</>}
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium bg-red-500/8 hover:bg-red-500/16 text-red-400 hover:text-red-300 transition-colors"
                >
                    <Trash2 className="w-4 h-4" /> Delete file
                </button>
            </div>
        </div>
    );
}
