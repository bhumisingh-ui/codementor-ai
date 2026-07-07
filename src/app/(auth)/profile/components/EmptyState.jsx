"use client";

import { Code2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md shadow-2xl mt-8">
      <div className="w-20 h-20 bg-[#00ff9d]/10 rounded-full flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 bg-[#00ff9d]/20 rounded-full animate-ping" />
        <Code2 className="w-10 h-10 text-[#00ff9d]" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-3">No submissions yet</h2>
      <p className="text-gray-400 max-w-md mb-8">
        You haven't solved any coding challenges yet. Start your journey by tackling your first problem in the editor.
      </p>
      
      <Link
        href="/editor"
        className="group relative inline-flex items-center gap-2 px-8 py-3 bg-[#00ff9d] text-black font-bold rounded-lg overflow-hidden transition-transform hover:scale-105"
      >
        <span className="relative z-10 flex items-center gap-2">
          Start Coding <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
        <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
      </Link>
    </div>
  );
}
