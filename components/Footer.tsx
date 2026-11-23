import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full border-t border-stone-200 bg-stone-50/80 pt-16 pb-8 px-6 text-stone-500 font-sans z-10 relative">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 text-center md:text-left">
                <div className="max-w-sm mx-auto md:mx-0">
                    <Link href="/" className="inline-block mb-6">
                        <img src="/logo/light.svg" alt="CoreBase" className="h-8 w-auto opacity-90 hover:opacity-100 transition-opacity" />
                    </Link>
                    <p className="text-sm leading-relaxed mb-8">
                        The backend for modern applications. Build faster, scale securely, and stop managing complex infrastructure.
                    </p>
                    <div className="flex gap-4 justify-center md:justify-start">
                        <Link href="https://github.com" className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:border-primary-300 hover:text-primary-700 transition-colors">
                            <Github className="w-5 h-5" />
                        </Link>
                        <Link href="https://twitter.com" className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:border-primary-300 hover:text-primary-700 transition-colors">
                            <Twitter className="w-5 h-5" />
                        </Link>
                        <Link href="https://linkedin.com" className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:border-primary-300 hover:text-primary-700 transition-colors">
                            <Linkedin className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-auto text-left">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-stone-900 font-semibold mb-1">Product</h3>
                        <Link href="/platform" className="text-sm hover:text-primary-700 transition-colors">Platform</Link>
                        <Link href="#" className="text-sm hover:text-primary-700 transition-colors">Pricing</Link>
                        <Link href="https://corebase-docs.trivyaa.in" className="text-sm hover:text-primary-700 transition-colors">Documentation</Link>
                        <Link href="#" className="text-sm hover:text-primary-700 transition-colors">Changelog</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="text-stone-900 font-semibold mb-1">Company</h3>
                        <Link href="#" className="text-sm hover:text-primary-700 transition-colors">About Us</Link>
                        <Link href="#" className="text-sm hover:text-primary-700 transition-colors">Blog</Link>
                        <Link href="#" className="text-sm hover:text-primary-700 transition-colors">Careers</Link>
                        <Link href="#" className="text-sm hover:text-primary-700 transition-colors">Contact</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="text-stone-900 font-semibold mb-1">Legal</h3>
                        <Link href="#" className="text-sm hover:text-primary-700 transition-colors">Privacy Policy</Link>
                        <Link href="#" className="text-sm hover:text-primary-700 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-stone-200 flex flex-col md:flex-row items-center justify-between text-xs gap-4">
                <p>© {new Date().getFullYear()} CoreBase. All rights reserved.</p>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="hover:text-primary-700 transition-colors cursor-pointer">All systems operational</span>
                </div>
            </div>
        </footer>
    );
}
