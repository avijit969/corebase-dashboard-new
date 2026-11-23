"use client";
import { motion, useReducedMotion } from "framer-motion";

const STATS = [
    { value: "99.99", unit: "%", label: "Uptime" },
    { value: "50", unit: "ms", label: "Latency" },
    { value: "10", unit: "k+", label: "Developers" },
    { value: "1", unit: "B+", label: "Requests" },
];
// Non-uniform stagger reads as one motion, not four
const DELAYS = [0, 0.05, 0.09, 0.12];

export function StatsSection() {
    const reduce = useReducedMotion();
    return (
        <section className="grid grid-cols-2 md:grid-cols-4 mb-24 lg:mb-36 rounded-3xl border border-stone-200 bg-white shadow-[0_1px_2px_rgb(68_37_10/0.04),0_20px_50px_-30px_rgb(154_52_18/0.25)] overflow-hidden">
            {STATS.map((s, i) => (
                <motion.div
                    key={s.label}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: DELAYS[i], ease: [0.23, 1, 0.32, 1] }}
                    className={`text-center py-10 md:py-12 border-stone-100 ${i % 2 ? "" : "border-r"} ${i < 2 ? "border-b md:border-b-0" : ""} ${i === 1 ? "md:border-r" : ""}`}
                >
                    <div className="text-3xl md:text-5xl font-bold tracking-tight text-stone-900 mb-2 tabular-nums">
                        {s.value}
                        <span className="text-primary-600">{s.unit}</span>
                    </div>
                    <div className="text-xs md:text-sm text-stone-500 uppercase tracking-wider font-semibold">{s.label}</div>
                </motion.div>
            ))}
        </section>
    );
}
