"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, ListChecks, TrendingUp, TrendingDown, Minus } from "lucide-react";
import AuroraCard from "@/components/AuroraCard";

function Trend({ value, label }) {
  if (value > 0) {
    return (
      <div className="flex items-center text-xs text-[#00ff9d] mt-2 gap-1 font-medium bg-[#00ff9d]/10 w-fit px-2 py-0.5 rounded-full">
        <TrendingUp className="w-3 h-3" />
        <span>+{value}% {label}</span>
      </div>
    );
  }
  if (value < 0) {
    return (
      <div className="flex items-center text-xs text-red-400 mt-2 gap-1 font-medium bg-red-400/10 w-fit px-2 py-0.5 rounded-full">
        <TrendingDown className="w-3 h-3" />
        <span>{value}% {label}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center text-xs text-gray-400 mt-2 gap-1 font-medium bg-gray-400/10 w-fit px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />
      <span>No change {label}</span>
    </div>
  );
}

export default function StatCards({ total, current, longest, trends = { total: 12, streak: 0 } }) {
  const section = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={section} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="w-full">
        <AuroraCard title="Total Submissions" value={total} icon={<div className="p-2 bg-[#06b6d4]/10 rounded-lg"><ListChecks className="w-6 h-6 text-[#06b6d4]" /></div>} width="100%" className="w-full">
          <Trend value={trends.total} label="vs last month" />
        </AuroraCard>
      </div>
      <div className="w-full">
        <AuroraCard title="Current Streak" value={current} icon={<div className="p-2 bg-[#f59e0b]/10 rounded-lg"><Flame className="w-6 h-6 text-[#f59e0b]" /></div>} width="100%" className="w-full">
          <Trend value={trends.streak} label="vs last month" />
        </AuroraCard>
      </div>
      <div className="w-full">
        <AuroraCard title="Longest Streak" value={longest} icon={<div className="p-2 bg-[#00ff9d]/10 rounded-lg"><Trophy className="w-6 h-6 text-[#00ff9d]" /></div>} width="100%" className="w-full">
          <div className="text-xs text-gray-400 mt-2 font-medium bg-gray-400/10 w-fit px-2 py-0.5 rounded-full">All time record</div>
        </AuroraCard>
      </div>
    </motion.div>
  );
}
