"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ConnectivitySection } from "@/components/landing/ConnectivitySection";
import { CodePreviewSection } from "@/components/landing/CodePreviewSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { CTASection } from "@/components/landing/CTASection";

export default function LandingPage() {
  const gradientBlobVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3],
      rotate: [0, 90, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <motion.div
        variants={gradientBlobVariants as any}
        animate="animate"
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />
      <motion.div
        variants={gradientBlobVariants as any}
        animate="animate"
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none"
      />
      <motion.div
        variants={gradientBlobVariants as any}
        animate="animate"
        className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ transitionDelay: '2s' }}
      />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-primary-500/10 bg-neutral-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo/dark.svg" alt="CoreBase" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/platform/login">
              <Button variant="ghost" className="hover:bg-white/5 hover:text-primary-400 text-gray-300 transition-colors">Login</Button>
            </Link>
            <Link href="/platform/signup">
              <Button className="bg-white text-black hover:bg-primary-50 hover:text-primary-900 border-0 transition-all shadow-lg hover:shadow-primary-500/20">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto z-10">
        <HeroSection />
        <FeaturesSection />
        <ConnectivitySection />
        <CodePreviewSection />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
