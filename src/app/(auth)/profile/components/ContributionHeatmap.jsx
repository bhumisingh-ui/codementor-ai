"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";

function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function getIntensity(count) {
  if (count >= 5) return "bg-[#00ff9d] shadow-[0_0_8px_rgba(0,255,157,0.6)]";
  if (count >= 3) return "bg-[#00ff9d]/70";
  if (count >= 1) return "bg-[#00ff9d]/40";
  return "bg-white/5";
}

export default function ContributionHeatmap({ submissions }) {
  const section = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  const byDate = useMemo(() => groupByDate(submissions), [submissions]);

  // Generate 52 weeks of data (approx 1 year) ending today
  const weeks = 52;
  const daysInWeek = 7;
  
  const matrix = useMemo(() => {
    const today = new Date();
    // find the most recent Saturday (end of the week for github-style, or Sunday depending on locale, let's use Saturday)
    // Actually github uses Sunday as first day (0) to Saturday (6).
    // Let's end on today.
    
    // Total days to show: 52 weeks * 7 days = 364 days.
    // Start date is 363 days ago.
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (weeks * daysInWeek - 1));

    // We want a grid of 7 rows (Sunday to Saturday) and 52 columns.
    // However, the first column might not start on a Sunday.
    // To make it simple, we just generate an array of weeks.
    
    // Let's align to actual weekdays.
    // Find the Sunday of the week that contains the start date.
    const startDayOfWeek = startDate.getDay();
    const alignedStartDate = new Date(startDate);
    alignedStartDate.setDate(startDate.getDate() - startDayOfWeek);
    
    const weeksData = [];
    let currentDate = new Date(alignedStartDate);
    
    while (currentDate <= today || currentDate.getDay() !== 0) {
      if (currentDate.getDay() === 0) {
        weeksData.push([]);
      }
      
      const iso = formatDateISO(currentDate);
      const isFuture = currentDate > today;
      const count = byDate.get(iso) || 0;
      
      const currentWeek = weeksData[weeksData.length - 1];
      if (currentWeek) {
        currentWeek.push({
          date: currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
          iso,
          count,
          isFuture
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate > today && currentDate.getDay() === 0) {
        break; // Stop if we've passed today and reached the end of a week
      }
    }
    
    return weeksData;
  }, [byDate]);

  return (
    <motion.div variants={section} initial="hidden" animate="show" className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#06b6d4]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Submission History</h2>
          <span className="text-sm text-gray-400">Last year of activity</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-4 md:mt-0 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-white/5" />
            <div className="w-3 h-3 rounded-sm bg-[#00ff9d]/40" />
            <div className="w-3 h-3 rounded-sm bg-[#00ff9d]/70" />
            <div className="w-3 h-3 rounded-sm bg-[#00ff9d] shadow-[0_0_8px_rgba(0,255,157,0.6)]" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 relative z-10">
        <div className="min-w-max flex gap-2">
          {/* Day Labels */}
          <div className="flex flex-col gap-1 text-xs text-gray-500 pr-2 pt-[14px]">
            <div className="h-[12px] flex items-center leading-none invisible">Sun</div>
            <div className="h-[12px] flex items-center leading-none">Mon</div>
            <div className="h-[12px] flex items-center leading-none invisible">Tue</div>
            <div className="h-[12px] flex items-center leading-none">Wed</div>
            <div className="h-[12px] flex items-center leading-none invisible">Thu</div>
            <div className="h-[12px] flex items-center leading-none">Fri</div>
            <div className="h-[12px] flex items-center leading-none invisible">Sat</div>
          </div>

          <Tooltip.Provider delayDuration={100}>
            <div className="flex gap-1">
              {matrix.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {/* Month Label (only show roughly if it's the start of a month) */}
                  {wIdx % 4 === 0 ? (
                    <div className="h-[10px] text-[10px] text-gray-500 mb-1 leading-none">
                      {week[0] ? new Date(week[0].iso).toLocaleString('default', { month: 'short' }) : ''}
                    </div>
                  ) : (
                    <div className="h-[10px] mb-1" />
                  )}
                  
                  {week.map((day, dIdx) => {
                    if (!day) return <div key={dIdx} className="w-[12px] h-[12px]" />;
                    
                    if (day.isFuture) {
                      return <div key={dIdx} className="w-[12px] h-[12px] rounded-sm bg-transparent" />;
                    }

                    return (
                      <Tooltip.Root key={day.iso}>
                        <Tooltip.Trigger asChild>
                          <div
                            className={`w-[12px] h-[12px] rounded-sm transition-all hover:scale-125 hover:ring-1 hover:ring-white/50 cursor-pointer ${getIntensity(day.count)}`}
                          />
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            className="z-50 rounded-md border border-white/10 bg-[#111111] px-3 py-1.5 text-xs text-gray-200 shadow-xl"
                            sideOffset={4}
                          >
                            <span className="font-semibold text-white">{day.count} submissions</span> on {day.date}
                            <Tooltip.Arrow className="fill-[#111111]" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    );
                  })}
                </div>
              ))}
            </div>
          </Tooltip.Provider>
        </div>
      </div>
    </motion.div>
  );
}
