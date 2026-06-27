"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
    return (
        <div className="text-center max-w-3xl mx-auto mb-24 lg:mb-32">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative flex flex-col items-center"
            >
                {/* Glowing Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-xs font-semibold mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:bg-primary-500/20 hover:border-primary-500/50 transition-all duration-300 cursor-default select-none"
                >
                    <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                    Now supporting Realtime subscriptions
                </motion.div>

                <div className="absolute inset-0 bg-primary-500/10 blur-[100px] -z-10 rounded-full" />
                
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-white">
                    The Backend for{" "}
                    <span className="bg-clip-text text-transparent bg-linear-to-r from-primary-400 via-primary-200 to-primary-400 animate-gradient-x">
                        Modern Apps
                    </span>
                </h1>
                
                <p className="text-sm sm:text-base md:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto px-4 sm:px-0">
                    Instant APIs, Database, and Auth for your next big idea.
                    Manage everything from a unified, stunning dashboard.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
                    <Link href="/platform" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full h-14 px-8 text-lg bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 border-0 shadow-lg shadow-primary-500/25 text-white cursor-pointer rounded-full transition-all hover:scale-105 active:scale-95 group">
                            Start Building Now
                            <motion.div
                                className="inline-block ml-2"
                                whileHover={{ x: 5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <ArrowRight className="w-5 h-5" />
                            </motion.div>
                        </Button>
                    </Link>
                    <Link href="https://corebase-docs.trivyaa.in" className="w-full sm:w-auto">
                        <Button size="lg" variant="outline" className="w-full h-14 px-8 text-lg border-white/10 bg-white/5 hover:bg-primary-500/10 hover:border-primary-500/50 hover:text-primary-100 text-gray-300 cursor-pointer rounded-full backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
                            Read Documentation
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

