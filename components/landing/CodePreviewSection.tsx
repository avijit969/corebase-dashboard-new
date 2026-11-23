"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

const EASE = [0.23, 1, 0.32, 1] as const;
const FEATURES = ["Type-safe SDKs", "Real-time subscriptions", "Automatic caching"];

export function CodePreviewSection() {
    const reduce = useReducedMotion();
    const rise = (delay: number) => ({
        initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.4 },
        transition: { duration: 0.6, delay, ease: EASE },
    });

    return (
        <section className="flex flex-col md:flex-row items-center gap-12 lg:gap-16 mb-24 lg:mb-36">
            <div className="flex-1 space-y-6 text-center md:text-left">
                <motion.h2 {...rise(0)} className="text-3xl md:text-5xl font-bold tracking-tight text-stone-900">
                    <span className="text-primary-600">Simple</span> by Design
                </motion.h2>
                <motion.p {...rise(0.06)} className="text-stone-600 text-lg md:text-xl leading-relaxed">
                    Stop wrestling with complex infrastructure. CoreBase gives you a simple, intuitive SDK to interact with
                    your database and auth in real-time.
                </motion.p>
                <motion.ul {...rise(0.12)} className="flex flex-col gap-3.5 max-w-sm mx-auto md:mx-0">
                    {FEATURES.map((f) => (
                        <li key={f} className="flex items-center gap-3 text-stone-700 font-medium">
                            <span className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 shrink-0">
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                            {f}
                        </li>
                    ))}
                </motion.ul>
            </div>

            <motion.div {...rise(0.1)} className="flex-1 w-full max-w-lg">
                <div className="rounded-2xl bg-stone-950 ring-1 ring-stone-900/10 overflow-hidden shadow-[0_30px_70px_-24px_rgb(124_45_18/0.45)]">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        <span className="ml-3 text-xs text-stone-500 font-mono">app.ts</span>
                    </div>
                    <div className="p-5 md:p-6 font-mono text-xs md:text-sm overflow-x-auto leading-relaxed text-left whitespace-pre text-stone-200">
                        <div className="text-stone-500 mb-2">// 1. Install</div>
                        <div className="mb-4"><span className="text-primary-400">npm</span> install corebase-js</div>

                        <div className="text-stone-500 mb-2">// 2. Initialize</div>
                        <div><span className="text-primary-300">import</span> {"{ createClient }"} <span className="text-primary-300">from</span> <span className="text-emerald-400">&apos;corebase-js&apos;</span>;</div>
                        <div className="mt-1"><span className="text-primary-300">const</span> corebase = <span className="text-sky-300">createClient</span>(</div>
                        <div className="pl-4 text-emerald-400">&apos;https://corebase.trivyaa.in&apos;<span className="text-stone-200">,</span></div>
                        <div className="pl-4 text-emerald-400">&apos;your-public-api-key&apos;</div>
                        <div>);</div>

                        <br />
                        <div className="text-stone-500 mb-2">// 3. Authenticate</div>
                        <div><span className="text-primary-300">const</span> {"{ data, error }"} = <span className="text-primary-300">await</span> corebase.<span className="text-sky-300">auth</span>.<span className="text-amber-200">signUp</span>({"{"}</div>
                        <div className="pl-4">email: <span className="text-emerald-400">&apos;user@example.com&apos;</span>,</div>
                        <div className="pl-4">password: <span className="text-emerald-400">&apos;password123&apos;</span></div>
                        <div>{"});"}</div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
