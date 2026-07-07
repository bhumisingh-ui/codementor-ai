"use client";

import { useEffect, useMemo, useState } from "react";
import ProfileHeader from "./components/ProfileHeader";
import StatCards from "./components/StatCards";
import ActivityCharts from "./components/ActivityCharts";
import ContributionHeatmap from "./components/ContributionHeatmap";
import SubmissionsList from "./components/SubmissionsList";
import LoadingState from "./components/LoadingState";
import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";

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

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const uRes = await fetch("/api/protected");
      if (!uRes.ok) throw new Error("Failed to fetch user");
      const uData = await uRes.json();
      setUser(uData.user);

      const sRes = await fetch("/api/submissions/history");
      if (!sRes.ok) throw new Error("Failed to fetch submissions");
      const sData = await sRes.json();
      setSubmissions(sData.submissions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
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
      } catch (err) {
        if (mounted) setError(err.message);
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

  return (
    <div className="min-h-screen bg-[#050505] text-white px-6 pt-24 pb-12 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-[120px]" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(0,255,157,0.12) 0%, rgba(6,182,212,0.06) 100%)" }} />
      </div>

      <div className="max-w-5xl mx-auto">
        <ProfileHeader user={user} activeTab="overview" />

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : total === 0 ? (
          <EmptyState />
        ) : (
          <>
            <StatCards total={total} current={current} longest={longest} trends={{ total: 12, streak: 0 }} />
            <ActivityCharts submissions={submissions} />
            <ContributionHeatmap submissions={submissions} />
            <SubmissionsList submissions={submissions} />
          </>
        )}
      </div>
    </div>
  );
}
