import Link from "next/link";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { ConnectivitySection } from "@/components/landing/ConnectivitySection";
import { CodePreviewSection } from "@/components/landing/CodePreviewSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { CTASection } from "@/components/landing/CTASection";

export default function LandingPage() {
  return (
    <div className="landing-light min-h-screen relative overflow-hidden font-sans">
      {/* Static warm glow + faint grid. No looping blobs: constant motion behind
          reading content is noise, and 120px blurs are expensive to repaint. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-[radial-gradient(60%_55%_at_50%_0%,color-mix(in_oklch,var(--primary-200)_70%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(120_53_15/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(120_53_15/0.05)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_70%_45%_at_50%_0%,#000_40%,transparent_100%)]"
      />

      <nav className="fixed top-0 w-full z-50 border-b border-stone-200/70 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo/light.svg" alt="CoreBase" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/platform/login"
              className="landing-press inline-flex h-9 items-center rounded-full px-4 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              Login
            </Link>
            <Link
              href="/platform/signup"
              className="landing-press inline-flex h-9 items-center rounded-full bg-stone-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-stone-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto z-10">
        <HeroSection />
        <ConnectivitySection />
        <CodePreviewSection />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
