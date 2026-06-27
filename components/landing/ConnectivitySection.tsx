"use client";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform, useTime } from "framer-motion";
import { Database, Flame, Lock, Server, type LucideIcon } from "lucide-react";

// Single SVG coordinate space so node chips and connector traces stay aligned
// at any screen size. Center is the CoreBase hub; services sit at the corners.
const CENTER = { x: 500, y: 310 };

type Service = {
    key: string;
    label: string;
    description: string;
    Icon: LucideIcon;
    x: number;
    y: number;
    color: string; // icon tint, reuses the primary-* palette
};

const SERVICES: Service[] = [
    {
        key: "database",
        label: "Database",
        description: "Powerful SQL database with real-time sync",
        Icon: Database,
        x: 185,
        y: 140,
        color: "text-primary-400",
    },
    {
        key: "storage",
        label: "Storage",
        description: "Scalable file storage with global CDN",
        Icon: Server,
        x: 815,
        y: 140,
        color: "text-primary-500",
    },
    {
        key: "auth",
        label: "Authentication",
        description: "Secure auth with OAuth, SSO, and JWT",
        Icon: Lock,
        x: 185,
        y: 480,
        color: "text-primary-300",
    },
    {
        key: "realtime",
        label: "Realtime",
        description: "Real-time subscriptions and live updates",
        Icon: Flame,
        x: 815,
        y: 480,
        color: "text-primary-400",
    },
];

// Node chip box (in viewBox units). The icon tile is centered on (x, y) with
// top padding so the floating animation never clips against the foreignObject edge.
const NODE_W = 260;
const NODE_H = 190;
const NODE_TOP_PAD = 52; // foreignObject top -> icon-tile center distance

// Helper function to generate orthogonal paths with rounded corners
function getRoundedPath(s: Service, R = 30) {
    const isLeft = s.x < CENTER.x;
    const isTop = s.y < CENTER.y;
    // Align starting point exactly at the service card border (border is at s.x +/- 40)
    const startX = isLeft ? s.x + 40 : s.x - 40;
    const laneX = isLeft ? 370 : 630;
    // Align endpoint exactly at the left/right borders of the central purple square (which spans x: 452 to 548)
    const endX = isLeft ? 452 : 548;
    const endY = isTop ? 290 : 330;

    if (isLeft && isTop) {
        // Path goes: Right -> Down -> Right
        return `M ${startX} ${s.y} H ${laneX - R} A ${R} ${R} 0 0 1 ${laneX} ${s.y + R} V ${endY - R} A ${R} ${R} 0 0 0 ${laneX + R} ${endY} H ${endX}`;
    } else if (!isLeft && isTop) {
        // Path goes: Left -> Down -> Left
        return `M ${startX} ${s.y} H ${laneX + R} A ${R} ${R} 0 0 0 ${laneX} ${s.y + R} V ${endY - R} A ${R} ${R} 0 0 1 ${laneX - R} ${endY} H ${endX}`;
    } else if (isLeft && !isTop) {
        // Path goes: Right -> Up -> Right
        return `M ${startX} ${s.y} H ${laneX - R} A ${R} ${R} 0 0 0 ${laneX} ${s.y - R} V ${endY + R} A ${R} ${R} 0 0 1 ${laneX + R} ${endY} H ${endX}`;
    } else {
        // Path goes: Left -> Up -> Left
        return `M ${startX} ${s.y} H ${laneX + R} A ${R} ${R} 0 0 1 ${laneX} ${s.y - R} V ${endY + R} A ${R} ${R} 0 0 0 ${laneX - R} ${endY} H ${endX}`;
    }
}

export function ConnectivitySection() {
    const reduce = useReducedMotion();
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scroll position of the connectivity section
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "start center"],
    });

    // Smooth out scroll progression using Framer Motion springs
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 60,
        damping: 20,
        restDelta: 0.001,
    });

    // Continuous time-driven hook for particle loops
    const time = useTime();
    const dashLength = 52; // 6px dash + 46px gap = 52px total unit length
    const loopOffset = useTransform(time, t => -(t / 20) % dashLength);

    // Scroll offset: scrolling accelerates the inward movement of particles
    const scrollOffset = useTransform(scrollYProgress, [0, 1], [0, -150]);

    // Combine time loop and scroll progress to determine dashoffset
    const particleOffset = useTransform(
        [loopOffset, scrollOffset],
        ([latestLoop, latestScroll]) => (latestLoop as number) + (latestScroll as number)
    );

    // Path drawing progression (staggered for each service line, fully drawn by 50% scroll)
    const pathLengths = SERVICES.map((_, i) => {
        const start = 0.05 + i * 0.05;
        const end = 0.35 + i * 0.05;
        return useTransform(smoothProgress, [start, end], [0, 1]);
    });

    // Particle flow opacities (fades in as lines finish drawing)
    const particleOpacities = SERVICES.map((_, i) => {
        const start = 0.15 + i * 0.05;
        return useTransform(smoothProgress, [start, start + 0.1], [0, 1]);
    });

    return (
        <section ref={containerRef} className="mb-24 lg:mb-32 relative">
            {/* Heading */}
            <motion.div
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center max-w-2xl mx-auto mb-12 lg:mb-16"
            >
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    One backend.{" "}
                    <span className="bg-clip-text text-transparent bg-linear-to-r from-primary-400 via-primary-200 to-primary-400 animate-gradient-x">
                        Every service.
                    </span>
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed">
                    Auth, storage, database, and realtime — unified under CoreBase.
                </p>
            </motion.div>

            {/* Hub diagram */}
            <div className="max-w-5xl mx-auto">
                <svg
                    viewBox="0 0 1000 620"
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-auto overflow-visible"
                    role="img"
                    aria-label="Auth, storage, database, and realtime services connecting into the central CoreBase backend"
                >
                    <defs>
                        <radialGradient id="cb-centerGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
                            <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                        </radialGradient>
                        <filter id="cb-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Connector traces — rounded purple circuit lines, drawn behind the nodes */}
                    {SERVICES.map((s, i) => {
                        const d = getRoundedPath(s, 30);
                        const isLeft = s.x < CENTER.x;
                        const startX = isLeft ? s.x + 40 : s.x - 40;
                        const endX = isLeft ? 452 : 548;
                        const isTop = s.y < CENTER.y;
                        const endY = isTop ? 290 : 330;

                        return (
                            <g key={`path-${s.key}`}>
                                {/* Soft glow underlay */}
                                <motion.path
                                    d={d}
                                    fill="none"
                                    stroke="#8b5cf6"
                                    strokeWidth={6}
                                    strokeLinecap="round"
                                    opacity={0.15}
                                    filter="url(#cb-glow)"
                                    style={{
                                        pathLength: reduce ? 1 : pathLengths[i],
                                    }}
                                />
                                {/* Main line connecting service to hub */}
                                <motion.path
                                    d={d}
                                    fill="none"
                                    stroke="#a78bfa"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    style={{
                                        pathLength: reduce ? 1 : pathLengths[i],
                                        opacity: reduce ? 0.7 : pathLengths[i],
                                    }}
                                />
                                {/* Flowing glowing particles (looping inward) */}
                                {!reduce && (
                                    <motion.path
                                        d={d}
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth={6}
                                        strokeLinecap="round"
                                        strokeDasharray="0 52"
                                        style={{
                                            strokeDashoffset: particleOffset,
                                            opacity: particleOpacities[i],
                                        }}
                                        filter="url(#cb-glow)"
                                    />
                                )}
                                {/* Service side connection socket */}
                                <motion.circle
                                    cx={startX}
                                    cy={s.y}
                                    r={4}
                                    fill="#ffffff"
                                    stroke="#a78bfa"
                                    strokeWidth={2.5}
                                    filter="url(#cb-glow)"
                                    style={{
                                        scale: reduce ? 1 : pathLengths[i],
                                        opacity: reduce ? 1 : pathLengths[i],
                                    }}
                                />
                                {/* Hub side connection socket */}
                                <motion.circle
                                    cx={endX}
                                    cy={endY}
                                    r={4}
                                    fill="#ffffff"
                                    stroke="#a78bfa"
                                    strokeWidth={2.5}
                                    filter="url(#cb-glow)"
                                    style={{
                                        scale: reduce ? 1 : pathLengths[i],
                                        opacity: reduce ? 1 : pathLengths[i],
                                    }}
                                />
                            </g>
                        );
                    })}

                    {/* Service nodes */}
                    {SERVICES.map((s, i) => (
                        <motion.g
                            key={`node-${s.key}`}
                            style={{ transformBox: "fill-box", transformOrigin: "center" }}
                            initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.6 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
                        >
                            <foreignObject
                                x={s.x - NODE_W / 2}
                                y={s.y - NODE_TOP_PAD}
                                width={NODE_W}
                                height={NODE_H}
                            >
                                <div className="flex flex-col items-center gap-2 pt-3 text-center">
                                    <motion.div
                                        className="w-20 h-20 rounded-2xl bg-neutral-900/60 border border-primary-500/20 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-primary-500/5 transition-all duration-300"
                                        animate={reduce ? undefined : { y: [0, -8, 0] }}
                                        transition={
                                            reduce
                                                ? undefined
                                                : { duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }
                                        }
                                        whileHover={{
                                            scale: 1.1,
                                            borderColor: "rgba(168, 85, 247, 0.6)",
                                            boxShadow: "0 0 25px rgba(168, 85, 247, 0.3)",
                                        }}
                                    >
                                        <s.Icon className={`w-9 h-9 ${s.color}`} />
                                    </motion.div>
                                    <span className="mt-1 text-lg font-semibold text-white">{s.label}</span>
                                    <span className="text-sm text-gray-400 leading-snug max-w-[200px] block mt-1">
                                        {s.description}
                                    </span>
                                </div>
                            </foreignObject>
                        </motion.g>
                    ))}

                    {/* Center CoreBase hub (rendered last so it sits above the trace ends) */}
                    <motion.g
                        style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {/* Soft circular glow drawn in SVG space, so it is never clipped into a box */}
                        <circle cx={CENTER.x} cy={CENTER.y} r={120} fill="url(#cb-centerGlow)" />
                        <foreignObject x={CENTER.x - 70} y={CENTER.y - 70} width={140} height={140}>
                            <div className="w-full h-full flex items-center justify-center">
                                <motion.img
                                    src="/favicon.svg"
                                    alt="CoreBase"
                                    className="w-24 h-24 rounded-3xl border border-primary-400/20"
                                    animate={reduce ? undefined : { scale: [1, 1.05, 1] }}
                                    transition={
                                        reduce ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }
                                    }
                                    whileHover={{ scale: 1.1, filter: "brightness(1.1)" }}
                                />
                            </div>
                        </foreignObject>
                        <foreignObject x={CENTER.x - 100} y={CENTER.y + 66} width={200} height={36}>
                            <div className="text-center">
                                <span className="text-lg font-semibold text-white">CoreBase</span>
                            </div>
                        </foreignObject>
                    </motion.g>
                </svg>
            </div>
        </section>
    );
}

