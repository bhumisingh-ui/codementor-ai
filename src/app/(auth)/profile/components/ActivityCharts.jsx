"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bar, Doughnut, Line } from "react-chartjs-2";
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
  Filler,
} from "chart.js";
import { BarChart, LineChart } from "lucide-react";
import AuroraCard from "@/components/AuroraCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

function languageBreakdown(submissions) {
  const map = new Map();
  submissions.forEach((s) => {
    const lang = (s.language || "javascript").toLowerCase();
    map.set(lang, (map.get(lang) || 0) + 1);
  });
  return map;
}

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

export default function ActivityCharts({ submissions }) {
  const [chartType, setChartType] = useState("line"); // 'line' | 'bar'

  const section = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  const days30 = useMemo(() => lastNDays(30), []);
  const byDate30 = useMemo(() => groupByDate(submissions), [submissions]);
  const dailyCounts = useMemo(() => days30.map((d) => byDate30.get(d) || 0), [days30, byDate30]);

  const langMap = useMemo(() => languageBreakdown(submissions), [submissions]);
  const langLabels = useMemo(() => Array.from(langMap.keys()), [langMap]);
  const langData = useMemo(() => Array.from(langMap.values()), [langMap]);

  const lineData = {
    labels: days30,
    datasets: [
      {
        label: "Submissions",
        data: dailyCounts,
        borderColor: "#00ff9d",
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(0, 255, 157, 0.4)");
          gradient.addColorStop(1, "rgba(0, 255, 157, 0.0)");
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#00ff9d",
        pointBorderColor: "#050505",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const barData = {
    labels: days30,
    datasets: [
      {
        label: "Daily",
        data: dailyCounts,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(6, 182, 212, 0.8)");
          gradient.addColorStop(1, "rgba(6, 182, 212, 0.2)");
          return gradient;
        },
        borderRadius: 4,
        borderWidth: 0,
      },
    ],
  };

  const langColors = ["#00ff9d", "#06b6d4", "#38bdf8", "#f59e0b", "#a78bfa", "#ef4444"];
  const doughnutData = {
    labels: langLabels,
    datasets: [
      {
        data: langData,
        backgroundColor: langColors,
        borderColor: "#0A0A0A",
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111111",
        titleColor: "#ededed",
        bodyColor: "#9ca3af",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280", maxTicksLimit: 7 },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        ticks: { color: "#6b7280", precision: 0 },
        grid: { color: "rgba(255,255,255,0.04)" },
        border: { display: false },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <motion.div variants={section} initial="hidden" animate="show" className="xl:col-span-2 rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff9d]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Activity Overview</h2>
            <span className="text-sm text-gray-400">Submissions over the last 30 days</span>
          </div>
          <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setChartType("line")}
              className={`p-1.5 rounded-md transition-all ${chartType === "line" ? "bg-white/10 text-[#00ff9d]" : "text-gray-400 hover:text-white"}`}
            >
              <LineChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`p-1.5 rounded-md transition-all ${chartType === "bar" ? "bg-white/10 text-[#06b6d4]" : "text-gray-400 hover:text-white"}`}
            >
              <BarChart className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="h-[280px] w-full relative z-10">
          {chartType === "line" ? (
            <Line data={lineData} options={commonOptions} />
          ) : (
            <Bar data={barData} options={commonOptions} />
          )}
        </div>
      </motion.div>

      <motion.div variants={section} initial="hidden" animate="show" className="h-full flex flex-col">
        <AuroraCard width="100%" height="100%" className="w-full h-full flex flex-col !justify-start !p-6" auroraMid="rgba(0, 255, 157, 0.15)">
          <div className="w-full flex flex-col h-full z-10">
            <h2 className="text-xl font-bold text-white mb-1">Language Mix</h2>
            <span className="text-sm text-gray-400 mb-6 block">Languages used</span>
            
            {submissions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">No data available</div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div className="h-[160px] flex justify-center mb-6">
                  <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false }, tooltip: { backgroundColor: "#111", titleColor: "#fff", bodyColor: "#aaa", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 } }, cutout: "75%" }} />
                </div>
                <div className="space-y-3">
                  {langLabels.slice(0, 4).map((lang, idx) => {
                    const count = langData[idx];
                    const percent = Math.round((count / submissions.length) * 100);
                    return (
                      <div key={lang} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: langColors[idx % langColors.length] }} />
                          <span className="text-gray-300 capitalize">{lang}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">{count} sub</span>
                          <span className="text-white font-medium w-8 text-right">{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {langLabels.length > 4 && (
                    <div className="text-xs text-gray-500 text-center mt-2">
                      + {langLabels.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </AuroraCard>
      </motion.div>
    </div>
  );
}
