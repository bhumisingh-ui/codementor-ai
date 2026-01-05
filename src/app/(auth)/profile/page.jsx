"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, ListChecks } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import AuroraCard from "@/components/AuroraCard";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function lastNDays(n) {
  const days = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(formatDateISO(d));
  }
  return days;
}

function groupByDate(submissions) {
  const map = new Map();
  submissions.forEach((s) => {
    const d = new Date(s.createdAt);
    const key = formatDateISO(d);
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

function languageBreakdown(submissions) {
  const map = new Map();
  submissions.forEach((s) => {
    const lang = (s.language || "javascript").toLowerCase();
    map.set(lang, (map.get(lang) || 0) + 1);
  });
  return map;
}

function streakInfo(submissions) {
  const byDate = groupByDate(submissions);
  const uniqueDates = Array.from(byDate.keys()).sort();
  let longest = 0;
  let current = 0;
  let prevDate = null;
  uniqueDates.forEach((iso) => {
    const d = new Date(iso);
    if (prevDate) {
      const diff = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        current += 1;
      } else {
        current = 1;
      }
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    prevDate = d;
  });
  const todayISO = formatDateISO(new Date());
  const hasToday = byDate.has(todayISO);
  if (!hasToday) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yISO = formatDateISO(yesterday);
    if (!byDate.has(yISO)) current = 0;
  }
  return { longest, current };
}

function weeksRange(weeks) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - weeks * 7 + 1);
  const dates = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function intensity(count) {
  if (count >= 5) return "bg-[#00ff9d]";
  if (count >= 3) return "bg-[#00ff9d]/70";
  if (count >= 1) return "bg-[#00ff9d]/40";
  return "bg-white/10";
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const uRes = await fetch("/api/protected");
        if (uRes.ok) {
          const uData = await uRes.json();
          if (mounted) setUser(uData.user);
        }
        const sRes = await fetch("/api/submissions/history");
        if (sRes.ok) {
          const sData = await sRes.json();
          if (mounted) setSubmissions(sData.submissions || []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const total = submissions.length;
  const { longest, current } = useMemo(() => streakInfo(submissions), [submissions]);

  const days30 = useMemo(() => lastNDays(30), []);
  const byDate30 = useMemo(() => groupByDate(submissions), [submissions]);
  const dailyCounts = useMemo(() => days30.map((d) => byDate30.get(d) || 0), [days30, byDate30]);

  const langMap = useMemo(() => languageBreakdown(submissions), [submissions]);
  const langLabels = useMemo(() => Array.from(langMap.keys()), [langMap]);
  const langData = useMemo(() => Array.from(langMap.values()), [langMap]);

  const weeksDates = useMemo(() => weeksRange(18), []);
  const byDateAll = useMemo(() => groupByDate(submissions), [submissions]);

  const lineData = {
    labels: days30,
    datasets: [
      {
        label: "Submissions",
        data: dailyCounts,
        borderColor: "#00ff9d",
        backgroundColor: "#00ff9d",
        tension: 0.3,
      },
    ],
  };

  const barData = {
    labels: days30,
    datasets: [
      {
        label: "Daily",
        data: dailyCounts,
        backgroundColor: "#06b6d4",
      },
    ],
  };

  const doughnutData = {
    labels: langLabels,
    datasets: [
      {
        data: langData,
        backgroundColor: ["#00ff9d", "#06b6d4", "#38bdf8", "#f59e0b", "#a78bfa", "#ef4444"],
        borderColor: "#0A0A0A",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#ededed" } },
      title: { color: "#ededed" },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(255,255,255,0.06)" } },
      y: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(255,255,255,0.06)" } },
    },
  };

  const section = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 pt-24">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(0,255,157,0.12) 0%, rgba(6,182,212,0.06) 100%)" }} />
      </div>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div variants={section} initial="hidden" animate="show" className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: "0 0 30px rgba(0,255,157,0.35)" }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative w-14 h-14 rounded-full bg-[#00ff9d] text-black font-bold flex items-center justify-center">
                {(user?.username || "U").slice(0, 2).toUpperCase()}
              </div>
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{user?.username || "Your Profile"}</h1>
              <p className="text-gray-400 text-sm">{user?.email || "Signed in user"}</p>
            </div>
          </div>
          <Link href="/editor" className="px-4 py-2 text-sm font-bold bg-[#00ff9d] text-black rounded-md hover:translate-y-0.5 hover:bg-[#00ff9d]/90 transition-all shadow-[0_0_15px_rgba(0,255,157,0.4)]">Go to Editor</Link>
        </motion.div>

        <motion.div variants={section} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AuroraCard title="Total Submissions" value={total} icon={<ListChecks className="w-5 h-5 text-[#06b6d4]" />} />
          <AuroraCard title="Current Streak" value={current} icon={<Flame className="w-5 h-5 text-[#f59e0b]" />} />
          <AuroraCard title="Longest Streak" value={longest} icon={<Trophy className="w-5 h-5 text-[#00ff9d]" />} />
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div variants={section} initial="hidden" animate="show" className="xl:col-span-2 rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">30-Day Activity</h2>
              <span className="text-xs text-gray-400">Daily submissions</span>
            </div>
            <Line data={lineData} options={chartOptions} />
          </motion.div>
          <motion.div variants={section} initial="hidden" animate="show" className="">
            <AuroraCard width={360} height={300} className="w-full">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Language Mix</h2>
              </div>
              <div className="mt-2">
                <Doughnut data={doughnutData} options={{ plugins: { legend: { labels: { color: "#ededed" } } } }} />
              </div>
            </AuroraCard>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div variants={section} initial="hidden" animate="show" className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Daily Breakdown</h2>
              <span className="text-xs text-gray-400">Last 30 days</span>
            </div>
            <Bar data={barData} options={chartOptions} />
          </motion.div>
          <motion.div variants={section} initial="hidden" animate="show" className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
            <h2 className="text-lg font-semibold mb-4">Submission Streak</h2>
            <Tooltip.Provider>
              <div className="grid grid-cols-18 gap-1" style={{ gridTemplateColumns: "repeat(18, 12px)", gridAutoRows: "12px" }}>
                {weeksDates.map((d, idx) => {
                  const iso = formatDateISO(d);
                  const count = byDateAll.get(iso) || 0;
                  const cls = intensity(count);
                  return (
                    <Tooltip.Root key={iso + idx}>
                      <Tooltip.Trigger asChild>
                        <div className={`rounded ${cls} transition-transform hover:scale-105`} />
                      </Tooltip.Trigger>
                      <Tooltip.Content side="top" className="z-50 rounded-md border border-white/10 bg-[#0A0A0A] px-2 py-1 text-xs text-gray-200 shadow-lg">
                        {iso}: {count}
                      </Tooltip.Content>
                    </Tooltip.Root>
                  );
                })}
              </div>
            </Tooltip.Provider>
            <div className="mt-3 text-xs text-gray-400">Darker = more submissions</div>
          </motion.div>
        </div>

        <motion.div variants={section} initial="hidden" animate="show" className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Submissions</h2>
            <span className="text-xs text-gray-400">Showing latest 50</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-md bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-sm text-gray-400">No submissions yet.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {submissions.map((s) => (
                <motion.div key={s._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="py-3 flex items-center justify-between hover:bg-white/5 rounded-md px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#00ff9d]" />
                    <div>
                      <div className="text-sm font-medium">{s.problemTitle || "Untitled"}</div>
                      <div className="text-xs text-gray-400">{(s.language || "javascript").toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
