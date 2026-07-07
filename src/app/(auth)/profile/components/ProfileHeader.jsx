"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function ProfileHeader({ user, activeTab = "overview" }) {
  const section = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={section} initial="hidden" animate="show" className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <motion.div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 30px rgba(0,255,157,0.35)" }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="relative w-16 h-16 rounded-full bg-[#00ff9d] text-black font-bold flex items-center justify-center text-xl">
            {(user?.username || "U").slice(0, 2).toUpperCase()}
          </div>
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{user?.username || "Your Profile"}</h1>
          <div className="flex items-center text-sm text-gray-400 gap-2">
            <span>{user?.email || "Signed in user"}</span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-[#00ff9d] capitalize">{activeTab}</span>
          </div>
        </div>
      </div>
      <Link href="/editor" className="px-5 py-2.5 text-sm font-bold bg-[#00ff9d] text-black rounded-lg hover:translate-y-[-2px] hover:bg-[#00ff9d]/90 transition-all shadow-[0_0_15px_rgba(0,255,157,0.4)] flex items-center justify-center">
        Go to Editor
      </Link>
    </motion.div>
  );
}
