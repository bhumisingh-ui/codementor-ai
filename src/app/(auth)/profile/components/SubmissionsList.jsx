"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function getLanguageColor(lang) {
  const l = (lang || "").toLowerCase();
  if (l === "javascript" || l === "js") return "bg-yellow-400";
  if (l === "python" || l === "py") return "bg-blue-500";
  if (l === "cpp" || l === "c++") return "bg-pink-500";
  if (l === "java") return "bg-orange-500";
  return "bg-[#06b6d4]";
}

function getRelativeTime(date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDifference === 0) {
    const hoursDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60));
    if (hoursDifference === 0) {
      const minutesDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60));
      return rtf.format(minutesDifference, 'minute');
    }
    return rtf.format(hoursDifference, 'hour');
  }
  return rtf.format(daysDifference, 'day');
}

export default function SubmissionsList({ submissions }) {
  const [visibleCount, setVisibleCount] = useState(10);

  const section = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  const visibleSubmissions = submissions.slice(0, visibleCount);
  const hasMore = visibleCount < submissions.length;

  return (
    <motion.div variants={section} initial="hidden" animate="show" className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Recent Submissions</h2>
          <span className="text-sm text-gray-400">Total {submissions.length} submissions</span>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {visibleSubmissions.map((s, i) => (
            <motion.div
              key={s._id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ff9d] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-4 mb-3 md:mb-0">
                <div className="w-10 h-10 rounded-full bg-[#00ff9d]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#00ff9d]" />
                </div>
                <div>
                  <div className="text-base font-semibold text-white group-hover:text-[#00ff9d] transition-colors">
                    {s.problemTitle || "Untitled Problem"}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${getLanguageColor(s.language)}`} />
                      <span className="text-xs text-gray-400 font-medium capitalize">{(s.language || "javascript")}</span>
                    </div>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-400">Accepted</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                <div className="text-right group" title={new Date(s.createdAt).toLocaleString()}>
                  <div className="text-sm text-gray-300">{getRelativeTime(new Date(s.createdAt))}</div>
                </div>
                <Link
                  href="/editor" // In a real app this might be `/submissions/${s._id}`
                  className="flex items-center gap-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  View <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Load More
          </button>
        </div>
      )}
    </motion.div>
  );
}
