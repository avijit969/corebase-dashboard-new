import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Shield, AlertTriangle, Loader2 } from 'lucide-react';

interface ProjectSettingsProps {
    projectName: string;
    handleDeleteProject: () => void;
    handleRenameProject?: (name: string) => Promise<void>;
}

export function ProjectSettings({ projectName, handleDeleteProject, handleRenameProject }: ProjectSettingsProps) {
    const [confirmName, setConfirmName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [newName, setNewName] = useState(projectName);
    const [isRenaming, setIsRenaming] = useState(false);

    const onDelete = async () => {
        setIsDeleting(true);
        await handleDeleteProject();
        setIsDeleting(false);
    };

    const onRename = async () => {
        if (!handleRenameProject || !newName.trim() || newName.trim() === projectName) return;
        setIsRenaming(true);
        await handleRenameProject(newName.trim());
        setIsRenaming(false);
    };

    return (
        <div className="space-y-6">
            {/* General */}
            <Card className="bg-neutral-900/50 border-white/10 text-white backdrop-blur-sm animate-in fade-in duration-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-400" />
                        General
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Basic project settings.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-name" className="text-gray-300">Project Name</Label>
                        <div className="flex gap-3">
                            <Input
                                id="project-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="bg-black/50 border-white/10 text-white focus-visible:ring-primary-500 flex-1"
                            />
                            <Button
                                onClick={onRename}
                                disabled={isRenaming || !newName.trim() || newName.trim() === projectName}
                                className="bg-primary-600 hover:bg-primary-700 text-white shrink-0"
                            >
                                {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-neutral-900/50 border-white/10 text-white backdrop-blur-sm animate-in fade-in duration-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gray-400" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Irreversible and destructive actions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                        <p className="text-sm text-red-300/70 mb-4">
                            Deleting a project is irreversible. All data, including users and tables, will be permanently lost.
                        </p>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">Delete Project</Button>
                            </DialogTrigger>
                            <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-red-500">
                                        <AlertTriangle className="w-5 h-5" />
                                        Delete Project
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                        This action cannot be undone. This will permanently delete the project <span className="font-bold text-white">{projectName}</span> and remove all associated data.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-4 py-4">
                                    <Label htmlFor="confirm-name" className="text-gray-300">
                                        Type <span className="font-mono text-primary-400 bg-primary-400/10 px-1 rounded">{projectName}</span> to confirm.
                                    </Label>
                                    <Input
                                        id="confirm-name"
                                        value={confirmName}
                                        onChange={(e) => setConfirmName(e.target.value)}
                                        className="bg-black/50 border-white/10 text-white focus:ring-red-500/50"
                                        placeholder="Enter project name"
                                        autoComplete="off"
                                    />
                                </div>
                                <DialogFooter className="gap-2 sm:justify-between">
                                    <DialogClose asChild>
                                        <Button variant="ghost" className="hover:bg-white/10 text-gray-400 hover:text-white">Cancel</Button>
                                    </DialogClose>
                                    <Button
                                        variant="destructive"
                                        onClick={onDelete}
                                        disabled={confirmName !== projectName || isDeleting}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {isDeleting ? "Deleting..." : "Delete Project"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
