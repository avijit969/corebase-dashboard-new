import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroDemo } from "./HeroDemo";

// Entrance: one short cascade (badge → headline → copy → actions → demo),
// CSS-only so it stays smooth while the page is still hydrating.
const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export function HeroSection() {
    return (
        <section className="mb-24 lg:mb-36">
            <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
                <div
                    style={d(0)}
                    className="landing-rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary-200 bg-white/80 text-primary-800 text-xs font-semibold mb-8 shadow-sm select-none"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-60 motion-safe:animate-ping" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
                    </span>
                    Now supporting Realtime subscriptions
                </div>

                <h1
                    style={d(60)}
                    className="landing-rise text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05] text-stone-900"
                >
                    The Backend for{" "}
                    <span className="bg-clip-text text-transparent bg-linear-to-br from-primary-500 via-primary-600 to-primary-800">
                        Modern Apps
                    </span>
                </h1>

                <p
                    style={d(120)}
                    className="landing-rise text-base md:text-xl text-stone-600 mb-10 leading-relaxed max-w-2xl"
                >
                    Instant APIs, Database, and Auth for your next big idea. Manage everything from a unified, stunning
                    dashboard.
                </p>

                <div style={d(170)} className="landing-rise flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                    <Link
                        href="/platform"
                        className="landing-press group inline-flex w-full sm:w-auto h-12 items-center justify-center gap-2 rounded-full bg-primary-600 px-7 text-base font-semibold text-white shadow-[0_8px_24px_-8px_var(--primary-600),inset_0_1px_0_rgb(255_255_255/0.2)] hover:bg-primary-700"
                    >
                        Start Building Now
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-(--ease-out) [@media(hover:hover)]:group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                        href="https://corebase-docs.trivyaa.in"
                        className="landing-press inline-flex w-full sm:w-auto h-12 items-center justify-center rounded-full border border-stone-200 bg-white px-7 text-base font-semibold text-stone-700 shadow-sm hover:border-stone-300 hover:bg-stone-50"
                    >
                        Read Documentation
                    </Link>
                </div>
            </div>

            <div style={d(260)} className="landing-rise relative mt-16 md:mt-20 max-w-[1040px] mx-auto">
                <HeroDemo />
            </div>
        </section>
    );
}
