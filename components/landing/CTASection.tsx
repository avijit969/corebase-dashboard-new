"use client";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
    const reduce = useReducedMotion();
    return (
        <motion.section
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="relative rounded-[2rem] bg-linear-to-br from-primary-500 via-primary-600 to-primary-700 p-8 md:p-16 text-center overflow-hidden mb-12 shadow-[0_40px_80px_-40px_var(--primary-700)]"
        >
            {/* Static light and texture; no looping glow */}
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(255_255_255/0.22),transparent_70%)] pointer-events-none" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.07)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_at_center,#000_30%,transparent_75%)] pointer-events-none" />

            <h2 className="relative text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
                Ready to Scale?
            </h2>
            <p className="relative text-lg md:text-xl text-primary-50/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of developers building the future with CoreBase. Get started for free today.
            </p>

            <Link
                href="/platform/signup"
                className="landing-press group relative inline-flex w-full md:w-auto h-14 items-center justify-center gap-2 rounded-full bg-white px-10 text-lg font-semibold text-primary-800 shadow-[0_10px_30px_-10px_rgb(67_20_7/0.5)] hover:bg-primary-50"
            >
                Create Free Account
                <ArrowRight className="h-5 w-5 transition-transform duration-200 ease-(--ease-out) [@media(hover:hover)]:group-hover:translate-x-0.5" />
            </Link>
        </motion.section>
    );
}
