"use client";

import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/lib/stores/project-store';
import { BucketSidebar } from './_components/BucketSidebar';
import { FileBrowser } from './_components/FileBrowser';
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function StoragePage({ params }: { params: { id: string } }) {
    const { currentApiKey } = useProjectStore();
    const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const apiKey = currentApiKey;

    if (!apiKey) {
        return <div className="p-8 text-neutral-400">Loading project context...</div>;
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-[#07070f] text-white overflow-hidden">
            {/* Desktop Sidebar */}
            <BucketSidebar
                apiKey={apiKey}
                selectedBucket={selectedBucket}
                onSelectBucket={setSelectedBucket}
                className="hidden md:flex"
            />

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                <SheetContent side="left" className="border-r-0 bg-[#09090f] w-72 max-w-[80vw] p-0" showCloseButton={false}>
                    <BucketSidebar
                        apiKey={apiKey}
                        selectedBucket={selectedBucket}
                        onSelectBucket={(bucket) => {
                            setSelectedBucket(bucket);
                            setIsMobileSidebarOpen(false);
                        }}
                        className="w-full border-none"
                    />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0d0d18]">
                <FileBrowser
                    apiKey={apiKey}
                    bucketName={selectedBucket}
                    onToggleSidebar={() => setIsMobileSidebarOpen(true)}
                />
            </div>
        </div>
    );
}
