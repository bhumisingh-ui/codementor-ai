"use client";

import { useEffect, useState } from "react";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const res = await fetch("/api/submissions/history");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load submissions");
        } else {
          setSubmissions(data.submissions);
        }
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Submissions</h1>

      {submissions.length === 0 && (
        <p>No submissions yet.</p>
      )}

      <div className="space-y-4">
        {submissions.map((s) => (
          <div
            key={s._id}
            className="border rounded-lg p-4 bg-[#0a0a0a]"
          >
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{s.problemTitle}</span>
              <span>
                {new Date(s.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="text-xs text-gray-500 mb-2">
              Language: {s.language}
            </div>

            <pre className="bg-black text-green-400 p-3 rounded overflow-x-auto text-sm">
              {s.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
