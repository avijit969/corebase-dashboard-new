"use client";
import { Badge, Collapse, Roll, Stage, Window, type Act } from "@/components/stageshow/kit";
import { Clock, Code2, HardDrive, KeyRound, LayoutDashboard, Mail, Table2 } from "lucide-react";
import "./hero-demo.css";

// CoreBase hero: a write from the SDK lands in the dashboard in realtime.
// Beats: the terminal types an insert, the API answers 201, the row drops
// into the users table with one orange wash, and the row count rolls a beat
// later. Twice, so the second insert pushes the first down: the table is
// live, not a screenshot. Plays once; the poster is the finished table.
//
// Real strings: the inserted rows, the table name, the count and the code.
// Existing rows are quiet real data (a table is where dense data reads right).

type S = { typed: [string, string]; sent: [boolean, boolean]; inserted: number; wash: number };

const NEW = [
    { name: "Ada Lovelace", email: "ada@analytical.io", plan: "pro", created: "just now" },
    { name: "Grace Hopper", email: "grace@cobol.dev", plan: "team", created: "just now" },
];
const BASE = [
    { name: "Linus Park", email: "linus@kernel.sh", plan: "free", created: "2m ago" },
    { name: "Mira Sato", email: "mira@sato.design", plan: "pro", created: "14m ago" },
    { name: "Owen Reyes", email: "owen@reyes.app", plan: "team", created: "1h ago" },
    { name: "Noor Haddad", email: "noor@haddad.co", plan: "free", created: "3h ago" },
    { name: "Theo Grant", email: "theo@grant.dev", plan: "pro", created: "5h ago" },
    { name: "Ines Moreau", email: "ines@moreau.fr", plan: "team", created: "8h ago" },
    { name: "Kai Jensen", email: "kai@jensen.io", plan: "free", created: "1d ago" },
    { name: "Ruth Okafor", email: "ruth@okafor.dev", plan: "pro", created: "1d ago" },
];
const COUNT = 1284;
const PLAN_TONE = { free: "neutral", pro: "accent", team: "success" } as const;

const initial: S = { typed: ["", ""], sent: [false, false], inserted: 0, wash: -1 };
const POSTER: S = { typed: [NEW[0].name, NEW[1].name], sent: [true, true], inserted: 2, wash: -1 };

async function insert(a: Act<S>, i: 0 | 1) {
    // Type into the i-th command's name literal
    const text = NEW[i].name;
    for (let k = 1; k <= text.length; k++) {
        a.put((s) => {
            const typed = [...s.typed] as S["typed"];
            typed[i] = text.slice(0, k);
            return { typed };
        });
        await a.wait(55);
    }
    await a.wait(380);
    // Response, then the row arrives over the wire a beat later
    a.put((s) => {
        const sent = [...s.sent] as S["sent"];
        sent[i] = true;
        return { sent };
    });
    await a.wait(320);
    a.put({ inserted: i + 1, wash: i });
    await a.wait(1100);
    a.put({ wash: -1 });
}

async function script(a: Act<S>) {
    await a.wait(900);
    a.mark("first");
    await insert(a, 0);
    await a.wait(700);
    a.mark("second");
    await insert(a, 1);
    await a.wait(2000);
}

function Cmd({ typed, sent, at }: { typed: string; sent: boolean; at: number }) {
    return (
        <div className="cbd-cmd" data-active={!sent && typed.length > 0 ? "" : undefined}>
            <div className="cbd-line">
                <span className="cbd-sigil">›</span>
                <span>
                    <span className="cbd-kw">await</span> corebase.<span className="cbd-fn">from</span>(
                    <span className="cbd-str">&apos;users&apos;</span>).<span className="cbd-fn">insert</span>
                    {"({ "}name: <span className="cbd-str">&apos;{typed}</span>
                    {!sent && typed.length > 0 && <span className="cbd-caret" />}
                    <span className="cbd-str">&apos;</span>
                    {" })"}
                </span>
            </div>
            <Collapse open={sent}>
                <div className="cbd-res">
                    <span className="cbd-ok">201 Created</span>
                    <span className="cbd-dim"> · {at}ms</span>
                    <span className="cbd-dim cbd-rt"> · realtime → 3 subscribers</span>
                </div>
            </Collapse>
        </div>
    );
}

const NAV = [
    { label: "Overview", Icon: LayoutDashboard },
    { label: "Tables", Icon: Table2, active: true },
    { label: "Authentication", Icon: KeyRound },
    { label: "Storage", Icon: HardDrive },
    { label: "Functions", Icon: Code2 },
    { label: "Cron jobs", Icon: Clock },
    { label: "Email", Icon: Mail },
];

export function HeroDemo() {
    return (
        <Stage<S>
            width={1040}
            height={500}
            compact={{ below: 720, width: 358, height: 460 }}
            initial={initial}
            poster={POSTER}
            script={script}
            play="once"
            accent="#ea580c"
            tokens={{ "--ss-font": "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" } as never}
            className="cbd"
        >
            {(s, _rect, layout) => {
                const compact = layout === "compact";
                const rows = [
                    ...NEW.map((r, i) => ({ ...r, i })).reverse(),
                    ...BASE.map((r) => ({ ...r, i: -1 })),
                ];
                return (
                    <>
                        <Window
                            url={compact ? undefined : "app.corebase.dev/acme-prod/tables/users"}
                            className="cbd-win"
                            sidebarWidth={196}
                            sidebar={
                                compact ? undefined : (
                                    <nav className="cbd-side">
                                        <div className="cbd-proj">
                                            <img src="/favicon.svg" alt="" className="cbd-proj-logo" />
                                            <span>acme-prod</span>
                                        </div>
                                        {NAV.map(({ label, Icon, active }) => (
                                            <div key={label} className="cbd-nav" data-active={active ? "" : undefined}>
                                                <Icon size={15} strokeWidth={1.8} />
                                                {label}
                                            </div>
                                        ))}
                                    </nav>
                                )
                            }
                        >
                            <div className="cbd-main">
                                <div className="cbd-head">
                                    <div className="cbd-title">
                                        <Table2 size={16} strokeWidth={1.8} />
                                        users
                                        <Badge tone="success" dot>
                                            Live
                                        </Badge>
                                    </div>
                                    <span className="cbd-count">
                                        <Roll delay={350}>{`${(COUNT + s.inserted).toLocaleString("en-US")} rows`}</Roll>
                                    </span>
                                </div>
                                <div className="cbd-table">
                                    <div className="cbd-row cbd-row--head">
                                        <span>name</span>
                                        <span className="cbd-email">email</span>
                                        <span>plan</span>
                                        <span className="cbd-created">created_at</span>
                                    </div>
                                    {rows.map((r) => {
                                        const row = (
                                            <div className="cbd-row" data-wash={r.i >= 0 && s.wash === r.i ? "" : undefined}>
                                                <span className="cbd-name">{r.name}</span>
                                                <span className="cbd-email">{r.email}</span>
                                                <span>
                                                    <Badge tone={PLAN_TONE[r.plan as keyof typeof PLAN_TONE]}>{r.plan}</Badge>
                                                </span>
                                                <span className="cbd-created">{r.created}</span>
                                            </div>
                                        );
                                        return r.i >= 0 ? (
                                            <Collapse key={r.email} open={s.inserted > r.i}>
                                                {row}
                                            </Collapse>
                                        ) : (
                                            <div key={r.email}>{row}</div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Window>

                        <Window chrome="terminal" title="seed.ts — node" className="cbd-term">
                            <div className="cbd-term-body">
                                <Cmd typed={s.typed[0]} sent={s.sent[0]} at={38} />
                                <Collapse open={s.inserted >= 1}>
                                    <Cmd typed={s.typed[1]} sent={s.sent[1]} at={41} />
                                </Collapse>
                            </div>
                        </Window>
                    </>
                );
            }}
        </Stage>
    );
}
